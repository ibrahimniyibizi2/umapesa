export interface ReceiptData {
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  recipientCountry: string;
  amount: number;
  fee: number;
  total: number;
  currency: string;
  transactionId: string;
  reference: string;
  paymentMethod: string;
  date: string;
  status: string;
}

export async function generateReceiptPDF(data: ReceiptData): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  
  // Set document properties
  doc.setProperties({
    title: 'Payment Receipt',
    subject: 'Transaction Receipt',
    author: 'UmaPesa',
    creator: 'UmaPesa'
  });

  // Add receipt header
  doc.setFontSize(18);
  doc.text('UmaPesa Payment Receipt', 20, 20);
  
  // Add receipt details
  doc.setFontSize(12);
  doc.text(`Date: ${new Date(data.date).toLocaleString()}`, 20, 35);
  doc.text(`Transaction ID: ${data.transactionId}`, 20, 45);
  doc.text(`Reference: ${data.reference}`, 20, 55);
  
  // Add recipient information
  doc.text('Recipient Information', 20, 75);
  doc.text(`Name: ${data.recipientName}`, 30, 85);
  doc.text(`Phone: ${data.recipientPhone}`, 30, 95);
  doc.text(`Email: ${data.recipientEmail || 'N/A'}`, 30, 105);
  
  // Add payment details
  doc.text('Payment Details', 20, 125);
  doc.text(`Amount: ${data.amount.toFixed(2)} ${data.currency}`, 30, 135);
  doc.text(`Fee: ${data.fee.toFixed(2)} ${data.currency}`, 30, 145);
  doc.text(`Total: ${data.total.toFixed(2)} ${data.currency}`, 30, 155);
  doc.text(`Payment Method: ${data.paymentMethod}`, 30, 165);
  
  // Add status
  doc.setFontSize(14);
  doc.setTextColor(0, 128, 0); // Green color for status
  doc.text(`Status: ${data.status.toUpperCase()}`, 20, 185);
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Add footer
  doc.setFontSize(10);
  doc.text('Thank you for using UmaPesa!', 20, 280);
  
  // Convert to Blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
  doc.text(`Recipient: ${data.recipientName}`, 20, 55);
  doc.text(`Email: ${data.recipientEmail}`, 20, 65);
  doc.text(`Phone: ${data.recipientPhone}`, 20, 75);
  doc.text(`Country: ${data.recipientCountry}`, 20, 85);
  doc.text(`Amount: ${data.amount.toLocaleString()} ${data.currency}`, 20, 95);
  doc.text('Thank you for using UmaPesa!', 20, 115);
  return doc.output('arraybuffer');
}
