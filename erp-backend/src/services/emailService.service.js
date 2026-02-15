// src/services/emailService.service.js
// Email Service for sending Purchase Order PDFs

import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Configure email transporter (you can use different providers)
    // For development, using Gmail SMTP as example
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });

    // For production, you might want to use other providers like:
    // - SendGrid
    // - AWS SES
    // - Mailgun
    // - Custom SMTP server
  }

  // Send Purchase Order PDF via email
  async sendPurchaseOrderEmail(poData, pdfPath, supplierEmail) {
    try {
      const {
        po_number,
        supplier_name,
        contact_person,
        order_date,
        items = [],
        total_amount = 0
      } = poData;

      // Calculate totals for email
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const tax = subtotal * 0.18;
      const finalTotal = subtotal + tax;

      const emailSubject = `Purchase Order ${po_number} - Enterprising Manufacturing Co Pvt Ltd.`;
      
      const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #1e40af;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 20px;
              border-radius: 0 0 8px 8px;
            }
            .po-details {
              background-color: white;
              padding: 15px;
              border-radius: 8px;
              margin: 15px 0;
              border-left: 4px solid #1e40af;
            }
            .items-summary {
              background-color: white;
              padding: 15px;
              border-radius: 8px;
              margin: 15px 0;
            }
            .totals {
              background-color: #e5e7eb;
              padding: 15px;
              border-radius: 8px;
              margin: 15px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding: 15px;
              background-color: #f3f4f6;
              border-radius: 8px;
            }
            .highlight {
              color: #1e40af;
              font-weight: bold;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }
            th, td {
              padding: 8px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              background-color: #f3f4f6;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Enterprising Manufacturing Co Pvt Ltd.</h1>
            <p>Purchase Order Notification</p>
          </div>

          <div class="content">
            <h2>Dear ${contact_person || supplier_name},</h2>
            
            <p>We are pleased to inform you that a new Purchase Order has been generated for your company.</p>

            <div class="po-details">
              <h3>Purchase Order Details</h3>
              <p><strong>PO Number:</strong> <span class="highlight">${po_number}</span></p>
              <p><strong>Order Date:</strong> ${new Date(order_date).toLocaleDateString('en-GB')}</p>
              <p><strong>Supplier:</strong> ${supplier_name}</p>
            </div>

            <div class="items-summary">
              <h3>Order Summary</h3>
              <p><strong>Total Items:</strong> ${items.length}</p>
              <p><strong>Total Quantity:</strong> ${items.reduce((sum, item) => sum + item.quantity, 0)}</p>
            </div>

            <div class="totals">
              <h3>Financial Summary</h3>
              <table>
                <tr>
                  <td>Subtotal:</td>
                  <td>PKR ${subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Sales Tax (18%):</td>
                  <td>PKR ${tax.toLocaleString()}</td>
                </tr>
                <tr>
                  <td><strong>Total Amount:</strong></td>
                  <td><strong>PKR ${finalTotal.toLocaleString()}</strong></td>
                </tr>
              </table>
            </div>

            <p>The detailed Purchase Order document is attached to this email as a PDF file.</p>

            <p><strong>Delivery Address:</strong><br>
            Plot # 9, Sector 26<br>
            Korangi Industrial Area<br>
            Karachi-Pakistan-74900</p>

            <p>Please review the attached Purchase Order and confirm receipt. If you have any questions or need clarification on any items, please contact us immediately.</p>

            <p>We look forward to your prompt delivery and quality service.</p>

            <div class="footer">
              <p><strong>Thank you for your business!</strong></p>
              <p>Enterprising Manufacturing Co Pvt Ltd.<br>
              Tel: (+9221) 3507-5379, (+92300) 9279500<br>
              Email: info@emcpl.com.pk</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailText = `
        Purchase Order ${po_number} - Enterprising Manufacturing Co Pvt Ltd.

        Dear ${contact_person || supplier_name},

        We are pleased to inform you that a new Purchase Order has been generated for your company.

        Purchase Order Details:
        - PO Number: ${po_number}
        - Order Date: ${new Date(order_date).toLocaleDateString('en-GB')}
        - Supplier: ${supplier_name}
        - Total Items: ${items.length}
        - Total Quantity: ${items.reduce((sum, item) => sum + item.quantity, 0)}
        - Total Amount: PKR ${finalTotal.toLocaleString()}

        The detailed Purchase Order document is attached to this email as a PDF file.

        Delivery Address:
        Plot # 9, Sector 26
        Korangi Industrial Area
        Karachi-Pakistan-74900

        Please review the attached Purchase Order and confirm receipt.

        Thank you for your business!

        Enterprising Manufacturing Co Pvt Ltd.
        Tel: (+9221) 3507-5379, (+92300) 9279500
        Email: info@emcpl.com.pk
      `;

      const mailOptions = {
        from: {
          name: 'Enterprising Manufacturing Co Pvt Ltd.',
          address: process.env.EMAIL_USER || 'noreply@emcpl.com.pk'
        },
        to: supplierEmail,
        cc: process.env.EMAIL_CC || '', // Optional CC for internal tracking
        subject: emailSubject,
        text: emailText,
        html: emailHTML,
        attachments: [
          {
            filename: `PO_${po_number}_${supplier_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
            path: pdfPath,
            contentType: 'application/pdf'
          }
        ]
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info({
        po_number,
        supplier_email: supplierEmail,
        message_id: info.messageId
      }, 'Purchase Order email sent successfully');

      return {
        success: true,
        messageId: info.messageId,
        message: 'Purchase Order email sent successfully'
      };

    } catch (error) {
      logger.error({
        error: error.message,
        po_number: poData.po_number,
        supplier_email: supplierEmail
      }, 'Failed to send Purchase Order email');

      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  // Send test email (for testing email configuration)
  async sendTestEmail(toEmail) {
    try {
      const mailOptions = {
        from: {
          name: 'Enterprising Manufacturing Co Pvt Ltd.',
          address: process.env.EMAIL_USER || 'noreply@emcpl.com.pk'
        },
        to: toEmail,
        subject: 'Test Email - ERP System',
        html: `
          <h2>Test Email from ERP System</h2>
          <p>This is a test email to verify email configuration.</p>
          <p>If you receive this email, the email service is working correctly.</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        `,
        text: `
          Test Email from ERP System
          
          This is a test email to verify email configuration.
          If you receive this email, the email service is working correctly.
          
          Time: ${new Date().toLocaleString()}
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: info.messageId,
        message: 'Test email sent successfully'
      };

    } catch (error) {
      logger.error({ error: error.message }, 'Failed to send test email');
      throw new Error(`Test email failed: ${error.message}`);
    }
  }

  // Verify email configuration
  async verifyConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
      logger.error({ error: error.message }, 'Email configuration verification failed');
      return { success: false, error: error.message };
    }
  }
}

export default new EmailService();
