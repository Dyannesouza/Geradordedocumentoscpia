import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { DocumentField } from "./DocumentEditor";

const headerLogoUrl = "https://i.imgur.com/ty5YKrU.png";

interface DocumentPreviewProps {
  fields: DocumentField[];
  title: string;
  date?: string;
  clientName?: string;
  footerText: string;
}

const findValueColumnIndex = (tableData: string[][]) => {
  if (!tableData[0]) return -1;
  return tableData[0].findIndex((header) =>
    /valor|price|preço|total/i.test(header)
  );
};

const calculateTotal = (tableData: string[][], columnIndex: number) => {
  if (columnIndex === -1) return 0;
  let total = 0;
  for (let i = 1; i < tableData.length; i++) {
    const value = tableData[i][columnIndex];
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

const formatDateToBR = (dateString: string) => {
  if (!dateString) return "";
  // Se já estiver no formato dd-mm-yyyy, retorna como está
  if (dateString.includes("-") && dateString.split("-")[0].length === 2) {
    return dateString;
  }
  // Se estiver no formato yyyy-mm-dd (input type="date"), converte
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

export function DocumentPreview({ fields, title, date, clientName, footerText }: DocumentPreviewProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Preview do Documento</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          id="document-preview" 
          className="bg-white border rounded-lg p-8 shadow-sm max-h-[calc(100vh-280px)] overflow-y-auto"
          style={{ minHeight: "400px" }}
        >
          {/* Logo fixo no topo */}
          <div className="flex justify-center mb-8">
            <img 
              src={headerLogoUrl} 
              alt="Bela Pedra - Mármores & Granitos" 
              className="h-40 w-auto mx-[50px] my-[0px]"
            />
          </div>

          {title && (
            <h1 className="mb-6 text-gray-900 border-b pb-3 text-[20px]">
              {title}
            </h1>
          )}
          
          {date && (
            <p className="mb-6 text-gray-900 text-sm">
              Carpina, {formatDateToBR(date)}
            </p>
          )}
          
          {clientName && (
            <p className="mb-6 text-gray-900 text-sm">
              Cliente: {clientName}
            </p>
          )}
          
          <div className="space-y-6">
            {fields.map((field) => (
              <div key={field.id}>
                {field.type === "text" && field.value && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      {field.label}
                    </div>
                    <div className="text-gray-900">
                      {field.value}
                    </div>
                  </div>
                )}

                {field.type === "textarea" && field.value && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      {field.label}
                    </div>
                    <div className="text-gray-900 whitespace-pre-wrap">
                      {field.value}
                    </div>
                  </div>
                )}

                {field.type === "image" && field.value && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">
                      {field.label}
                    </div>
                    <img
                      src={field.value}
                      alt={field.label}
                      className="max-w-full h-auto rounded border"
                      style={{ maxHeight: "400px" }}
                    />
                  </div>
                )}

                {field.type === "table" && field.tableData && (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            {field.tableData[0]?.map((header, index) => (
                              <th
                                key={index}
                                className="border border-gray-300 px-4 py-2 text-left text-gray-900"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {field.tableData.slice(1).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className="border border-gray-300 px-4 py-2 text-gray-900"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                          {/* Linha de TOTAL */}
                          {(() => {
                            const valueColIndex = findValueColumnIndex(field.tableData);
                            if (valueColIndex !== -1) {
                              const total = calculateTotal(field.tableData, valueColIndex);
                              return (
                                <tr className="bg-blue-50 font-bold">
                                  {field.tableData[0].map((_, colIndex) => (
                                    <td 
                                      key={colIndex} 
                                      className="border border-gray-300 px-4 py-2 text-gray-900"
                                    >
                                      {colIndex === 0 ? "TOTAL" : colIndex === valueColIndex ? `R$ ${formatCurrency(total)}` : ""}
                                    </td>
                                  ))}
                                </tr>
                              );
                            }
                            return null;
                          })()}
                        </tbody>
                      </table>
                    </div>
                    {field.comments && (
                      <div className="mt-3 p-3 bg-gray-50 rounded border-2 border-black">
                        <div className="text-xs text-gray-600 mb-1">
                          Comentários e Observações:
                        </div>
                        <div className="text-sm text-gray-900 whitespace-pre-wrap">
                          {field.comments}
                        </div>
                      </div>
                    )}
                    
                    {/* Informações de Rodapé Editáveis */}
                    <div className="mt-4 p-4 bg-gray-100 rounded border border-gray-300">
                      <div className="text-sm text-gray-900 whitespace-pre-line">
                        {footerText}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {fields.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                Seu documento aparecerá aqui
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}