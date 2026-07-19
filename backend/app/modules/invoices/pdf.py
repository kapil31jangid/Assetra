import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def generate_invoice_pdf(invoice_data: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=inch,
        leftMargin=inch,
        topMargin=inch,
        bottomMargin=inch,
    )
    styles = getSampleStyleSheet()
    elements = []

    # Header
    elements.append(Paragraph(f"<b>INVOICE {invoice_data['number']}</b>", styles["Title"]))
    elements.append(Spacer(1, 0.25 * inch))

    # Customer info
    cust = invoice_data.get("customer", {})
    cust_name = cust.get("name", "N/A")
    cust_email = cust.get("email", "N/A")
    elements.append(Paragraph(f"<b>Billed To:</b><br/>{cust_name}<br/>{cust_email}", styles["Normal"]))
    elements.append(Spacer(1, 0.25 * inch))

    # Invoice details
    issued_at = invoice_data.get("issuedAt", "Draft")
    due_at = invoice_data.get("dueAt", "N/A")
    status = invoice_data.get("status", "N/A").upper()
    payment_status = invoice_data.get("paymentStatus", "N/A").upper()
    
    details = [
        ["Status:", status],
        ["Payment:", payment_status],
        ["Issued:", issued_at[:10] if issued_at and issued_at != "Draft" else "Draft"],
        ["Due:", due_at[:10] if due_at else "N/A"]
    ]
    details_table = Table(details, colWidths=[1.5 * inch, 2 * inch], hAlign='LEFT')
    elements.append(details_table)
    elements.append(Spacer(1, 0.5 * inch))

    # Line items table
    data = [["Description", "Qty", "Unit Price", "Total"]]
    for line in invoice_data.get("lines", []):
        unit_price = line.get("unitPrice", {})
        total = line.get("total", {})
        data.append([
            line.get("description", ""),
            str(line.get("quantity", 0)),
            f"{unit_price.get('currency', 'INR')} {unit_price.get('amount', 0.0):.2f}",
            f"{total.get('currency', 'INR')} {total.get('amount', 0.0):.2f}"
        ])

    # Summary rows
    subtotal = invoice_data.get("subtotal", {})
    tax = invoice_data.get("tax", {})
    total = invoice_data.get("total", {})
    amount_paid = invoice_data.get("amountPaid", 0.0)
    
    data.append(["", "", "Subtotal:", f"{subtotal.get('currency', 'INR')} {subtotal.get('amount', 0.0):.2f}"])
    data.append(["", "", "Tax (18%):", f"{tax.get('currency', 'INR')} {tax.get('amount', 0.0):.2f}"])
    data.append(["", "", "Total:", f"{total.get('currency', 'INR')} {total.get('amount', 0.0):.2f}"])
    data.append(["", "", "Amount Paid:", f"{total.get('currency', 'INR')} {amount_paid:.2f}"])
    
    balance = float(total.get('amount', 0.0)) - amount_paid
    data.append(["", "", "Balance Due:", f"{total.get('currency', 'INR')} {balance:.2f}"])

    table = Table(data, colWidths=[3 * inch, 0.75 * inch, 1.25 * inch, 1.25 * inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -6), 1, colors.black),  # Grid for line items
        ('FONTNAME', (2, -5), (2, -1), 'Helvetica-Bold'), # Bold summary labels
        ('LINEABOVE', (2, -5), (-1, -5), 1, colors.black), # Line above subtotal
        ('LINEBELOW', (2, -1), (-1, -1), 1, colors.black), # Line below balance
    ]))
    
    elements.append(table)
    
    # Generate PDF
    doc.build(elements)
    
    return buffer.getvalue()
