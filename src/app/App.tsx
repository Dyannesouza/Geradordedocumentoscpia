import { useState } from "react";
import { DocumentEditor, DocumentField } from "./components/DocumentEditor";
import { DocumentPreview } from "./components/DocumentPreview";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { FileDown, FileText, Edit, Eye } from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";

const headerLogoUrl = "https://i.imgur.com/ty5YKrU.png";

function App() {
  const [documentTitle, setDocumentTitle] = useState("Meu Documento");
  const [documentDate, setDocumentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [clientName, setClientName] = useState("");
  const [footerText, setFooterText] = useState(`Forma de Pagamento: À VISTA OU PIX
Validade do Orçamento: 15 Dias
Prazo de Entrega: 7 dias úteis

Atenciosamente,

Daniel Antônio
(81) 99333-3779
E-mail - neo10daniel@gmail.com`);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [fields, setFields] = useState<DocumentField[]>([
    {
      id: "1",
      type: "table",
      label: "Tabela Principal",
      value: "",
      tableData: [
        ["Item", "Descrição", "Metragem", "Valor"],
        ["", "", "", ""],
        ["", "", "", ""],
      ],
    },
  ]);

  const exportToPDF = async () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Função para formatar data
      const formatDateToBR = (dateString: string) => {
        if (!dateString) return "";
        const [year, month, day] = dateString.split("-");
        if (year && month && day) {
          const months = [
            "janeiro", "fevereiro", "março", "abril", "maio", "junho",
            "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
          ];
          const monthName = months[parseInt(month) - 1];
          return `${parseInt(day)} de ${monthName} de ${year}`;
        }
        return dateString;
      };

      // Adicionar logo no topo
      try {
        const logoImg = new Image();
        logoImg.src = headerLogoUrl;
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
        });

        // Calcular dimensões do logo (centralizado)
        const logoHeight = 40;
        const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
        const logoX = (pageWidth - logoWidth) / 2;

        pdf.addImage(headerLogoUrl, "PNG", logoX, yPosition, logoWidth, logoHeight);
        yPosition += logoHeight + 15;
      } catch (error) {
        console.error("Erro ao adicionar logo:", error);
      }

      // Adicionar título do documento
      if (documentTitle) {
        pdf.setFontSize(20);
        pdf.setFont("helvetica", "bold");
        pdf.text(documentTitle, margin, yPosition);
        yPosition += 10;
        
        // Linha separadora
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
      }

      // Adicionar data do documento
      if (documentDate) {
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Carpina, ${formatDateToBR(documentDate)}`, margin, yPosition);
        yPosition += 10;
      }

      // Adicionar nome do cliente
      if (clientName) {
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Cliente: ${clientName}`, margin, yPosition);
        yPosition += 10;
      }

      // Processar cada campo
      for (const field of fields) {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        if (field.type === "text" && field.value) {
          // Campo de texto
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(100, 100, 100);
          pdf.text(field.label, margin, yPosition);
          yPosition += 6;

          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          pdf.setFont("helvetica", "normal");
          const textLines = pdf.splitTextToSize(field.value, maxWidth);
          pdf.text(textLines, margin, yPosition);
          yPosition += textLines.length * 6 + 8;
        } else if (field.type === "textarea" && field.value) {
          // Campo de texto longo
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(100, 100, 100);
          pdf.text(field.label, margin, yPosition);
          yPosition += 6;

          pdf.setFontSize(11);
          pdf.setTextColor(0, 0, 0);
          pdf.setFont("helvetica", "normal");
          const textLines = pdf.splitTextToSize(field.value, maxWidth);
          
          // Dividir em páginas se necessário
          for (let i = 0; i < textLines.length; i++) {
            if (yPosition > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }
            pdf.text(textLines[i], margin, yPosition);
            yPosition += 6;
          }
          yPosition += 8;
        } else if (field.type === "image" && field.value) {
          // Campo de imagem
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(100, 100, 100);
          pdf.text(field.label, margin, yPosition);
          yPosition += 6;

          try {
            // Carregar imagem
            const img = new Image();
            img.src = field.value;
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });

            // Calcular dimensões mantendo proporção
            const imgWidth = img.width;
            const imgHeight = img.height;
            const ratio = imgWidth / imgHeight;
            
            let finalWidth = maxWidth;
            let finalHeight = finalWidth / ratio;
            
            // Limitar altura máxima
            const maxHeight = 100;
            if (finalHeight > maxHeight) {
              finalHeight = maxHeight;
              finalWidth = finalHeight * ratio;
            }

            // Verificar se precisa de nova página
            if (yPosition + finalHeight > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }

            // Adicionar imagem
            pdf.addImage(field.value, "JPEG", margin, yPosition, finalWidth, finalHeight);
            yPosition += finalHeight + 10;
          } catch (error) {
            console.error("Erro ao adicionar imagem:", error);
            toast.error("Erro ao adicionar imagem ao PDF");
          }
        } else if (field.type === "table" && field.tableData) {
          // Campo de tabela
          const tableData = field.tableData;
          const colCount = tableData[0]?.length || 0;
          const colWidth = maxWidth / colCount;
          const rowHeight = 8;

          // Encontrar coluna de valor
          const findValueColumnIndex = (data: string[][]) => {
            if (!data[0]) return -1;
            return data[0].findIndex((header) =>
              /valor|price|preço|total/i.test(header)
            );
          };

          const calculateTotal = (data: string[][], columnIndex: number) => {
            if (columnIndex === -1) return 0;
            let total = 0;
            for (let i = 1; i < data.length; i++) {
              const value = data[i][columnIndex];
              const numericValue = parseFloat(
                value.replace(/[R$\s]/g, "").replace(",", ".")
              );
              if (!isNaN(numericValue)) {
                total += numericValue;
              }
            }
            return total;
          };

          const formatCurrency = (value: number) => {
            return value.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          };

          const valueColIndex = findValueColumnIndex(tableData);

          // Desenhar cabeçalho
          pdf.setFillColor(100, 100, 100);
          pdf.rect(margin, yPosition, maxWidth, rowHeight, "F");
          
          // Desenhar borda superior do cabeçalho
          pdf.setLineWidth(0.1);
          pdf.line(margin, yPosition, margin + maxWidth, yPosition);
          
          // Desenhar bordas verticais do cabeçalho
          for (let i = 0; i <= colCount; i++) {
            const xPos = margin + i * colWidth;
            pdf.line(xPos, yPosition, xPos, yPosition + rowHeight);
          }
          
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(255, 255, 255);
          
          tableData[0]?.forEach((header, colIndex) => {
            const xPos = margin + colIndex * colWidth;
            const text = pdf.splitTextToSize(header, colWidth - 4);
            // Centralizar o texto no cabeçalho
            const textWidth = pdf.getTextWidth(text[0] || header);
            const centeredX = xPos + (colWidth - textWidth) / 2;
            pdf.text(text, centeredX, yPosition + 5);
          });
          
          yPosition += rowHeight;
          pdf.setLineWidth(0.1);
          pdf.line(margin, yPosition, margin + maxWidth, yPosition);

          // Desenhar linhas de dados
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(0, 0, 0);
          for (let i = 1; i < tableData.length; i++) {
            // Verificar se precisa de nova página
            if (yPosition + rowHeight > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }

            const row = tableData[i];
            row.forEach((cell, colIndex) => {
              const xPos = margin + colIndex * colWidth + 2;
              const text = pdf.splitTextToSize(cell, colWidth - 4);
              pdf.text(text, xPos, yPosition + 5);
            });

            yPosition += rowHeight;
            pdf.line(margin, yPosition, margin + maxWidth, yPosition);
          }

          // Adicionar linha de TOTAL
          if (valueColIndex !== -1) {
            const total = calculateTotal(tableData, valueColIndex);
            
            // Fundo cinza escuro para a linha de total
            pdf.setFillColor(100, 100, 100);
            pdf.rect(margin, yPosition, maxWidth, rowHeight, "F");
            
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(10);
            pdf.setTextColor(255, 255, 255);
            
            tableData[0].forEach((_, colIndex) => {
              const xPos = margin + colIndex * colWidth + 2;
              let text = "";
              if (colIndex === 0) {
                text = "TOTAL";
              } else if (colIndex === valueColIndex) {
                text = `R$ ${formatCurrency(total)}`;
              }
              if (text) {
                pdf.text(text, xPos, yPosition + 5);
              }
            });
            
            yPosition += rowHeight;
            pdf.line(margin, yPosition, margin + maxWidth, yPosition);
          }

          // Desenhar bordas verticais
          for (let i = 0; i <= colCount; i++) {
            const xPos = margin + i * colWidth;
            const startY = yPosition - rowHeight * (tableData.length + (valueColIndex !== -1 ? 1 : 0));
            pdf.line(xPos, startY, xPos, yPosition);
          }

          yPosition += 10;

          // Adicionar comentários se existirem
          if (field.comments) {
            // Calcular altura do bloco de comentários
            const commentLines = pdf.splitTextToSize(field.comments, maxWidth - 8);
            const commentsBoxHeight = 12 + commentLines.length * 5;
            
            // Desenhar retângulo ao redor dos comentários
            pdf.setDrawColor(0, 0, 0); // Cor da borda preta
            pdf.setLineWidth(0.5);
            pdf.rect(margin, yPosition, maxWidth, commentsBoxHeight);
            
            yPosition += 4; // Espaçamento interno superior
            
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "italic");
            pdf.setTextColor(100, 100, 100);
            pdf.text("Comentários e Observações:", margin + 4, yPosition);
            yPosition += 6;

            pdf.setFontSize(10);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(0, 0, 0);
            
            for (let i = 0; i < commentLines.length; i++) {
              if (yPosition > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin;
              }
              pdf.text(commentLines[i], margin + 4, yPosition);
              yPosition += 5;
            }
            yPosition += 4; // Espaçamento interno inferior
            yPosition += 8; // Espaçamento externo
          }

          // Adicionar informações de rodapé editáveis
          yPosition += 5;
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(0, 0, 0);

          const footerLines = footerText.split('\n');

          for (const line of footerLines) {
            if (yPosition > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }
            pdf.text(line, margin, yPosition);
            yPosition += 5;
          }
          yPosition += 8;
        }
      }

      // Salvar PDF
      pdf.save(`${documentTitle || "documento"}.pdf`);
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster />
      
      {/* Header Mobile */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <h1 className="text-lg font-semibold">Gerador de Documentos</h1>
          </div>
          
          <Button onClick={exportToPDF} className="w-full gap-2" size="lg">
            <FileDown className="w-5 h-5" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Document Info */}
      <div className="px-3 py-3 space-y-3">
        {/* Document Title */}
        <div className="bg-white rounded-lg border p-3">
          <Label htmlFor="doc-title" className="text-sm font-medium">Título do Documento</Label>
          <Input
            id="doc-title"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            placeholder="Digite o título..."
            className="mt-2 text-base"
          />
        </div>

        {/* Document Date */}
        <div className="bg-white rounded-lg border p-3">
          <Label htmlFor="doc-date" className="text-sm font-medium">Data do Documento</Label>
          <Input
            id="doc-date"
            type="date"
            value={documentDate}
            onChange={(e) => setDocumentDate(e.target.value)}
            className="mt-2 text-base"
          />
        </div>

        {/* Client Name */}
        <div className="bg-white rounded-lg border p-3">
          <Label htmlFor="client-name" className="text-sm font-medium">Nome do Cliente</Label>
          <Input
            id="client-name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Digite o nome do cliente..."
            className="mt-2 text-base"
          />
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-y sticky top-[120px] z-10">
        <div className="grid grid-cols-2">
          <button
            onClick={() => setActiveTab("edit")}
            className={`flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
              activeTab === "edit"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
          >
            <Edit className="w-5 h-5" />
            Editar
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
              activeTab === "preview"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
          >
            <Eye className="w-5 h-5" />
            Visualizar
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-3 py-4">
        {activeTab === "edit" ? (
          <DocumentEditor
            fields={fields}
            onFieldsChange={setFields}
            footerText={footerText}
            onFooterTextChange={setFooterText}
          />
        ) : (
          <DocumentPreview
            fields={fields}
            title={documentTitle}
            date={documentDate}
            clientName={clientName}
            footerText={footerText}
          />
        )}
      </div>
    </div>
  );
}

export default App;