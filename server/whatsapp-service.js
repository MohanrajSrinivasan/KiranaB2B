import twilio from 'twilio';

export class WhatsAppService {
  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (!accountSid || !authToken) {
      console.warn('Twilio credentials not configured');
      this.client = null;
      return;
    }

    this.client = twilio(accountSid, authToken);
  }

  async sendOrderConfirmation(toNumber, orderDetails) {
    try {
      if (!this.client) {
        console.warn('Twilio not configured - skipping WhatsApp message');
        return;
      }

      const message = `🛒 Order Confirmed!
Order ID: ${orderDetails.id}
Total: ₹${orderDetails.totalAmount}
Status: ${orderDetails.status}

Items:
${orderDetails.items.map((item) => `- ${item.productName} (${item.label}) x${item.quantity}`).join('\n')}

Thank you for your order! 🙏`;

      const result = await this.client.messages.create({
        body: message,
        from: `whatsapp:${this.fromNumber}`,
        to: `whatsapp:${toNumber}`
      });

      console.log('WhatsApp message sent:', result.sid);
      return result;
    } catch (error) {
      console.error('WhatsApp message failed:', error);
      throw error;
    }
  }

  async sendOrderStatusUpdate(toNumber, orderDetails) {
    try {
      if (!this.client) {
        console.warn('Twilio not configured - skipping WhatsApp message');
        return;
      }

      const message = `📦 Order Update
Order ID: ${orderDetails.id}
Status: ${orderDetails.status.toUpperCase()}
Total: ₹${orderDetails.totalAmount}

Track your order status anytime on our platform.`;

      const result = await this.client.messages.create({
        body: message,
        from: `whatsapp:${this.fromNumber}`,
        to: `whatsapp:${toNumber}`
      });

      console.log('WhatsApp status update sent:', result.sid);
      return result;
    } catch (error) {
      console.error('WhatsApp status update failed:', error);
      throw error;
    }
  }

  async sendLowStockAlert(toNumber, products) {
    try {
      if (!this.client) {
        console.warn('Twilio not configured - skipping WhatsApp message');
        return;
      }

      const message = `⚠️ Low Stock Alert

The following products are running low:
${products.map(p => `- ${p.name}: ${p.availableQuantity} left`).join('\n')}

Please restock soon to avoid stockouts.`;

      const result = await this.client.messages.create({
        body: message,
        from: `whatsapp:${this.fromNumber}`,
        to: `whatsapp:${toNumber}`
      });

      console.log('WhatsApp low stock alert sent:', result.sid);
      return result;
    } catch (error) {
      console.error('WhatsApp low stock alert failed:', error);
      throw error;
    }
  }
}

export const whatsappService = new WhatsAppService();