import React, { useRef } from 'react';
import { X, Download, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function Receipt({ sale, items = [], onClose }) {
  const receiptRef = useRef();

  const handleDownloadPDF = async () => {
    const element = receiptRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 size width in mm
      const pageHeight = 297; // A4 size height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice-${sale.invoice_number || 'Receipt'}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Actions */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-800">Billing Invoice Receipt</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          <div ref={receiptRef} className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-slate-800 font-sans max-w-[210mm] mx-auto">
            {/* Pharmacy Branding */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-brand-700 tracking-tight">PharmaTrack</h2>
              <p className="text-xs text-slate-500 mt-0.5">Your Trusted Digital Healthcare Partner</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-100 pb-4 mb-6">
              <div>
                <p className="text-slate-400 font-medium">INVOICE DETAILS</p>
                <p className="font-semibold text-slate-700 mt-1">Invoice: #{sale.invoice_number}</p>
                <p className="text-slate-600">Date: {sale.created_at ? new Date(sale.created_at).toLocaleString() : new Date().toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-medium">PATIENT / CUSTOMER</p>
                <p className="font-semibold text-slate-700 mt-1">{sale.customer_name || 'Walk-in Customer'}</p>
                <p className="text-slate-600">{sale.customer_phone || 'N/A'}</p>
              </div>
            </div>

            {/* Invoice Items Table */}
            <table className="w-full text-left text-xs mb-6">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-2">Medicine / Item</th>
                  <th className="pb-2 text-center">Qty</th>
                  <th className="pb-2 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr key={index} className="text-slate-700">
                    <td className="py-3 font-medium">
                      {item.name || item.medicine?.name}
                      <span className="block text-[10px] text-slate-400 font-normal">Batch: {item.batch_number || item.medicine?.batch_number || 'N/A'}</span>
                    </td>
                    <td className="py-3 text-center font-semibold">{item.quantity}</td>
                    <td className="py-3 text-right">₹{Number(item.unit_price || 0).toFixed(2)}</td>
                    <td className="py-3 text-right font-semibold">₹{Number(item.subtotal || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary Totals */}
            <div className="border-t border-slate-200 pt-4 flex flex-col items-end text-xs">
              <div className="w-48 space-y-2">
                <div className="flex justify-between font-bold text-sm text-brand-700 pt-1 border-t border-slate-100">
                  <span>Grand Total:</span>
                  <span>₹{Number(sale.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 mt-12 pt-4 border-t border-slate-100">
              Thank you for visiting! This is a system-generated electronic invoice statement receipt.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}