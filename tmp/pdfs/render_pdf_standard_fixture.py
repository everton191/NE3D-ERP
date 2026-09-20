from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak

out = "output/pdf/simplifica-pdf-standard-validation.pdf"
styles = getSampleStyleSheet()
teal = colors.HexColor("#0f766e")
doc = SimpleDocTemplate(out, pagesize=A4, rightMargin=16*mm, leftMargin=16*mm, topMargin=15*mm, bottomMargin=18*mm)
story = [Paragraph("SIMPLIFICA 3D", styles["Title"]), Paragraph("ORCAMENTO - Impressao 3D sob medida", styles["Heading2"]), Spacer(1, 5*mm)]
story += [Table([["Cliente", "Cliente de validacao"], ["Emissao", "12/07/2026"], ["Validade", "19/07/2026 (7 dias)"], ["Pagamento", "PIX / Transferencia"]], colWidths=[38*mm, 130*mm], style=TableStyle([("BACKGROUND",(0,0),(0,-1),colors.HexColor("#eef6f8")),("TEXTCOLOR",(0,0),(0,-1),teal),("GRID",(0,0),(-1,-1),.5,colors.HexColor("#d5e4e5")),("PADDING",(0,0),(-1,-1),7)])), Spacer(1,5*mm)]
rows=[["Item","Qtd.","Unitario","Total"]]+[[f"Peca 3D personalizada {i:02d}",str((i%3)+1),f"R$ {25+i},00",f"R$ {(25+i)*((i%3)+1)},00"] for i in range(1,25)]
table=Table(rows, repeatRows=1, colWidths=[82*mm,18*mm,34*mm,34*mm])
table.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),teal),("TEXTCOLOR",(0,0),(-1,0),colors.white),("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,colors.HexColor("#f1f7f8")]),("GRID",(0,0),(-1,-1),.4,colors.HexColor("#d5e4e5")),("ALIGN",(1,1),(-1,-1),"RIGHT"),("PADDING",(0,0),(-1,-1),6)]))
story += [table, Spacer(1,5*mm), Paragraph("Observacoes: cores podem variar conforme o lote do material. Alteracoes no projeto podem impactar o prazo.", styles["BodyText"]), PageBreak(), Paragraph("RESUMO E PAGAMENTO", styles["Heading1"]), Spacer(1,4*mm), Table([["Subtotal","R$ 1.845,00"],["Desconto","R$ 45,00"],["TOTAL","R$ 1.800,00"]], colWidths=[100*mm,68*mm], style=TableStyle([("BACKGROUND",(0,-1),(-1,-1),teal),("TEXTCOLOR",(0,-1),(-1,-1),colors.white),("ALIGN",(1,0),(1,-1),"RIGHT"),("GRID",(0,0),(-1,-1),.5,colors.HexColor("#d5e4e5")),("PADDING",(0,0),(-1,-1),8)])), Spacer(1,7*mm), Paragraph("PIX", styles["Heading2"]), Paragraph("Chave: contato@empresa.com.br<br/>Recebedor: Minha Empresa 3D<br/>Apos o pagamento, envie o comprovante pelo WhatsApp.", styles["BodyText"]), Spacer(1,12*mm), Paragraph("Qualquer duvida, estamos a disposicao.", styles["Italic"])]

def footer(canvas, _doc):
    canvas.saveState(); canvas.setFont("Helvetica",8); canvas.setFillColor(colors.HexColor("#526173")); canvas.drawString(16*mm,10*mm,"Minha Empresa 3D - contato@empresa.com.br"); canvas.drawRightString(194*mm,10*mm,f"Pagina {_doc.page}"); canvas.restoreState()

doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(out)
