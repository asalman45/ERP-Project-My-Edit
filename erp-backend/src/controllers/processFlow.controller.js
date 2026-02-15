// src/controllers/processFlow.controller.js
import * as routingModel from '../models/routing.model.js';
import * as bomModel from '../models/bom.model.js';
import { logger } from '../utils/logger.js';

export const getProcessFlow = async (req, res) => {
  try {
    const { productId } = req.params;
    const { includeAlternatives = true } = req.query;

    // Get primary process flow
    const primaryFlow = await routingModel.findByProductId(productId, true);
    
    let result = {
      product_id: productId,
      primary_flow: primaryFlow,
      alternative_flows: []
    };

    if (includeAlternatives === 'true') {
      // Get alternative process flows
      const alternativeFlows = await routingModel.findAlternativeFlows(productId);
      result.alternative_flows = alternativeFlows;
    }

    logger.info({ product_id: productId }, 'Process flow retrieved');
    return res.json({ data: result });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId }, 'Failed to get process flow');
    return res.status(500).json({ error: 'Failed to retrieve process flow. Please try again.' });
  }
};

export const createProcessFlow = async (req, res) => {
  try {
    const { productId } = req.params;
    const { steps, isPrimary = true, alternativePathId = null } = req.body;

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: 'Process steps are required' });
    }

    // Replace existing primary steps to avoid unique(product_id, step_no)
    if (isPrimary) {
      try {
        await routingModel.removePrimaryByProductId(productId);
      } catch (cleanupErr) {
        logger.warn({ cleanupErr, product_id: productId }, 'Process flow cleanup failed');
      }
    }

    const createdSteps = [];

    for (const step of steps) {
      const {
        step_no,
        operation,
        work_center,
        duration,
        cost_rate,
        description,
        is_primary_path = isPrimary
      } = step;

      if (!step_no || !operation) {
        return res.status(400).json({ 
          error: `Step ${step_no} is missing required fields: step_no and operation` 
        });
      }

      const routingStep = await routingModel.create({
        product_id: productId,
        step_no,
        operation,
        work_center,
        duration,
        cost_rate,
        is_primary_path,
        alternative_path_id: alternativePathId,
        description
      });

      createdSteps.push(routingStep);
    }

    logger.info({ 
      product_id: productId, 
      steps_count: createdSteps.length,
      is_primary: isPrimary 
    }, 'Process flow created');

    return res.status(201).json({ data: createdSteps });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId }, 'Failed to create process flow');
    return res.status(500).json({ error: 'Failed to create process flow. Please try again.' });
  }
};

export const updateProcessStep = async (req, res) => {
  try {
    const { routingId } = req.params;
    const updateData = req.body;

    const updatedStep = await routingModel.update(routingId, updateData);
    if (!updatedStep) {
      return res.status(404).json({ error: 'Process step not found' });
    }

    logger.info({ routing_id: routingId }, 'Process step updated');
    return res.json({ data: updatedStep });
  } catch (err) {
    logger.error({ err, routing_id: req.params.routingId }, 'Failed to update process step');
    return res.status(500).json({ error: 'Failed to update process step. Please try again.' });
  }
};

export const deleteProcessStep = async (req, res) => {
  try {
    const { routingId } = req.params;
    await routingModel.remove(routingId);

    logger.info({ routing_id: routingId }, 'Process step deleted');
    return res.status(204).send();
  } catch (err) {
    logger.error({ err, routing_id: req.params.routingId }, 'Failed to delete process step');
    return res.status(500).json({ error: 'Failed to delete process step. Please try again.' });
  }
};

export const createAlternativePath = async (req, res) => {
  try {
    const { productId } = req.params;
    const { steps, description } = req.body;

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: 'Alternative path steps are required' });
    }

    // Create alternative path steps
    const createdSteps = [];
    for (const step of steps) {
      const {
        step_no,
        operation,
        work_center,
        duration,
        cost_rate,
        step_description
      } = step;

      const routingStep = await routingModel.create({
        product_id: productId,
        step_no,
        operation,
        work_center,
        duration,
        cost_rate,
        is_primary_path: false,
        description: step_description || description
      });

      createdSteps.push(routingStep);
    }

    logger.info({ 
      product_id: productId, 
      steps_count: createdSteps.length 
    }, 'Alternative process path created');

    return res.status(201).json({ data: createdSteps });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId }, 'Failed to create alternative path');
    return res.status(500).json({ error: 'Failed to create alternative path. Please try again.' });
  }
};

export const getProcessFlowWithMaterials = async (req, res) => {
  try {
    const { productId } = req.params;

    // Get process flow
    const processFlow = await routingModel.findByProductId(productId);
    
    // Get BOM with sub-assemblies for each step
    const bomData = await bomModel.findByProductIdWithSubAssemblies(productId);

    // Group materials by step sequence
    const materialsByStep = {};
    bomData.forEach(item => {
      if (item.step_sequence) {
        if (!materialsByStep[item.step_sequence]) {
          materialsByStep[item.step_sequence] = [];
        }
        materialsByStep[item.step_sequence].push(item);
      }
    });

    // Combine process flow with materials
    const processFlowWithMaterials = processFlow.map(step => ({
      ...step,
      required_materials: materialsByStep[step.step_no] || [],
      material_count: materialsByStep[step.step_no]?.length || 0
    }));

    logger.info({ product_id: productId }, 'Process flow with materials retrieved');
    return res.json({ data: processFlowWithMaterials });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId }, 'Failed to get process flow with materials');
    return res.status(500).json({ error: 'Failed to retrieve process flow with materials. Please try again.' });
  }
};

export const validateProcessFlow = async (req, res) => {
  try {
    const { productId } = req.params;

    // Get process flow
    const processFlow = await routingModel.findByProductId(productId);
    
    // Get BOM data
    const bomData = await bomModel.findByProductIdWithSubAssemblies(productId);

    const validationResults = {
      product_id: productId,
      is_valid: true,
      issues: [],
      warnings: [],
      recommendations: []
    };

    // Check for missing step sequences in BOM
    const bomStepSequences = [...new Set(bomData.map(item => item.step_sequence).filter(seq => seq !== null))];
    const processStepNumbers = processFlow.map(step => step.step_no);

    const missingSteps = bomStepSequences.filter(seq => !processStepNumbers.includes(seq));
    if (missingSteps.length > 0) {
      validationResults.issues.push({
        type: 'missing_process_steps',
        message: `BOM references step sequences that don't exist in process flow: ${missingSteps.join(', ')}`,
        step_sequences: missingSteps
      });
      validationResults.is_valid = false;
    }

    // Check for process steps without materials
    const stepsWithoutMaterials = processStepNumbers.filter(stepNo => 
      !bomData.some(item => item.step_sequence === stepNo)
    );
    if (stepsWithoutMaterials.length > 0) {
      validationResults.warnings.push({
        type: 'steps_without_materials',
        message: `Process steps without assigned materials: ${stepsWithoutMaterials.join(', ')}`,
        step_numbers: stepsWithoutMaterials
      });
    }

    // Check for duplicate step numbers
    const duplicateSteps = processStepNumbers.filter((stepNo, index) => 
      processStepNumbers.indexOf(stepNo) !== index
    );
    if (duplicateSteps.length > 0) {
      validationResults.issues.push({
        type: 'duplicate_step_numbers',
        message: `Duplicate step numbers found: ${duplicateSteps.join(', ')}`,
        step_numbers: duplicateSteps
      });
      validationResults.is_valid = false;
    }

    // Check for missing work centers
    const stepsWithoutWorkCenters = processFlow.filter(step => !step.work_center);
    if (stepsWithoutWorkCenters.length > 0) {
      validationResults.warnings.push({
        type: 'missing_work_centers',
        message: `${stepsWithoutWorkCenters.length} steps without assigned work centers`,
        step_numbers: stepsWithoutWorkCenters.map(step => step.step_no)
      });
    }

    // Recommendations
    if (processFlow.length > 0 && bomData.length > 0) {
      validationResults.recommendations.push({
        type: 'optimization',
        message: 'Consider adding estimated durations and cost rates for better production planning'
      });
    }

    logger.info({ 
      product_id: productId, 
      is_valid: validationResults.is_valid,
      issues_count: validationResults.issues.length,
      warnings_count: validationResults.warnings.length
    }, 'Process flow validated');

    return res.json({ data: validationResults });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId }, 'Failed to validate process flow');
    return res.status(500).json({ error: 'Failed to validate process flow. Please try again.' });
  }
};

export const getProcessFlowStatistics = async (req, res) => {
  try {
    const { productId } = req.params;

    // Get process flow
    const processFlow = await routingModel.findByProductId(productId);
    
    // Get BOM data
    const bomData = await bomModel.findByProductIdWithSubAssemblies(productId);

    // Calculate statistics
    const statistics = {
      product_id: productId,
      total_steps: processFlow.length,
      total_materials: bomData.length,
      unique_sub_assemblies: [...new Set(bomData.map(item => item.sub_assembly_name).filter(name => name))].length,
      total_duration: processFlow.reduce((sum, step) => sum + (step.duration || 0), 0),
      total_cost_rate: processFlow.reduce((sum, step) => sum + (step.cost_rate || 0), 0),
      steps_with_work_centers: processFlow.filter(step => step.work_center).length,
      steps_with_durations: processFlow.filter(step => step.duration).length,
      steps_with_cost_rates: processFlow.filter(step => step.cost_rate).length,
      average_step_duration: processFlow.length > 0 ? 
        processFlow.reduce((sum, step) => sum + (step.duration || 0), 0) / processFlow.length : 0,
      average_cost_rate: processFlow.length > 0 ? 
        processFlow.reduce((sum, step) => sum + (step.cost_rate || 0), 0) / processFlow.length : 0
    };

    logger.info({ product_id: productId }, 'Process flow statistics calculated');
    return res.json({ data: statistics });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId }, 'Failed to get process flow statistics');
    return res.status(500).json({ error: 'Failed to get process flow statistics. Please try again.' });
  }
};
