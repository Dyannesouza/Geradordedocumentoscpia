import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { X, Plus, Upload, Table as TableIcon } from "lucide-react";

export interface DocumentField {
  id: string;
  type: "text" | "textarea" | "image" | "table";
  label: string;
  value: string;
  tableData?: string[][];
  comments?: string;
}

interface DocumentEditorProps {
  fields: DocumentField[];
  onFieldsChange: (fields: DocumentField[]) => void;
  footerText: string;
  onFooterTextChange: (text: string) => void;
}

export function DocumentEditor({ fields, onFieldsChange, footerText, onFooterTextChange }: DocumentEditorProps) {
  const addTextField = () => {
    const newField: DocumentField = {
      id: `field-${Date.now()}`,
      type: "text",
      label: "Novo Campo",
      value: "",
    };
    onFieldsChange([...fields, newField]);
  };

  const addTextAreaField = () => {
    const newField: DocumentField = {
      id: `field-${Date.now()}`,
      type: "textarea",
      label: "Novo Campo de Texto Longo",
      value: "",
    };
    onFieldsChange([...fields, newField]);
  };

  const addImageField = () => {
    const newField: DocumentField = {
      id: `field-${Date.now()}`,
      type: "image",
      label: "Nova Imagem",
      value: "",
    };
    onFieldsChange([...fields, newField]);
  };

  const addTableField = () => {
    const newField: DocumentField = {
      id: `field-${Date.now()}`,
      type: "table",
      label: "Nova Tabela",
      value: "",
      tableData: [
        ["Item", "Descrição", "Metragem", "Valor"],
        ["", "", "", ""],
        ["", "", "", ""],
      ],
    };
    onFieldsChange([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<DocumentField>) => {
    onFieldsChange(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const removeField = (id: string) => {
    onFieldsChange(fields.filter((field) => field.id !== id));
  };

  const handleImageUpload = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      updateField(id, { value: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const addTableRow = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (field && field.tableData) {
      const newRow = ["", "", "", ""];
      updateField(fieldId, {
        tableData: [...field.tableData, newRow],
      });
    }
  };

  const addTableColumn = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (field && field.tableData) {
      const newTableData = field.tableData.map((row, index) => [
        ...row,
        index === 0 ? `Cabeçalho ${row.length + 1}` : "",
      ]);
      updateField(fieldId, { tableData: newTableData });
    }
  };

  const removeTableRow = (fieldId: string, rowIndex: number) => {
    const field = fields.find((f) => f.id === fieldId);
    if (field && field.tableData && field.tableData.length > 2) {
      const newTableData = field.tableData.filter((_, i) => i !== rowIndex);
      updateField(fieldId, { tableData: newTableData });
    }
  };

  const removeTableColumn = (fieldId: string, colIndex: number) => {
    const field = fields.find((f) => f.id === fieldId);
    if (field && field.tableData && field.tableData[0].length > 2) {
      const newTableData = field.tableData.map((row) =>
        row.filter((_, i) => i !== colIndex)
      );
      updateField(fieldId, { tableData: newTableData });
    }
  };

  const updateTableCell = (
    fieldId: string,
    rowIndex: number,
    colIndex: number,
    value: string
  ) => {
    const field = fields.find((f) => f.id === fieldId);
    if (field && field.tableData) {
      const newTableData = field.tableData.map((row, rIdx) =>
        rIdx === rowIndex
          ? row.map((cell, cIdx) => (cIdx === colIndex ? value : cell))
          : row
      );
      updateField(fieldId, { tableData: newTableData });
    }
  };

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
      // Remove R$, espaços e vírgulas, depois converte para número
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

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Editor de Documento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={addTableField} variant="default" size="sm">
            <TableIcon className="w-4 h-4 mr-2" />
            Adicionar Tabela
          </Button>
        </div>

        <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
          {fields.map((field) => (
            <Card key={field.id} className="relative">
              
              <CardContent>
                {field.type === "table" && field.tableData && (
                  <div className="space-y-2">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border">
                        <tbody>
                          {field.tableData.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, colIndex) => (
                                <td
                                  key={colIndex}
                                  className={`border p-1 ${rowIndex === 0 ? 'bg-gray-100' : ''}`}
                                >
                                  <Input
                                    value={cell}
                                    onChange={(e) =>
                                      updateTableCell(
                                        field.id,
                                        rowIndex,
                                        colIndex,
                                        e.target.value
                                      )
                                    }
                                    className={`border-0 focus-visible:ring-0 h-8 text-sm ${
                                      rowIndex === 0 ? 'font-semibold bg-transparent' : ''
                                    }`}
                                    placeholder={rowIndex === 0 ? "Cabeçalho" : "Valor"}
                                    readOnly={rowIndex === 0}
                                  />
                                </td>
                              ))}
                              {rowIndex > 0 && (
                                <td className="border p-1 w-10">
                                  <Button
                                    onClick={() => removeTableRow(field.id, rowIndex)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </td>
                              )}
                            </tr>
                          ))}
                          {/* Linha de TOTAL */}
                          {(() => {
                            const valueColIndex = findValueColumnIndex(field.tableData);
                            if (valueColIndex !== -1) {
                              const total = calculateTotal(field.tableData, valueColIndex);
                              return (
                                <tr className="bg-blue-50">
                                  {field.tableData[0].map((_, colIndex) => (
                                    <td 
                                      key={colIndex} 
                                      className="border p-1 font-bold"
                                    >
                                      <div className="h-8 flex items-center px-2 text-sm">
                                        {colIndex === 0 ? "TOTAL" : colIndex === valueColIndex ? `R$ ${formatCurrency(total)}` : ""}
                                      </div>
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
                    <div className="flex gap-2">
                      <Button
                        onClick={() => addTableRow(field.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar Linha
                      </Button>
                    </div>
                    
                    {/* Campo de Comentários */}
                    <div className="space-y-2 pt-2 border-t">
                      <Label htmlFor={`comments-${field.id}`}>
                        Comentários e Observações
                      </Label>
                      <Textarea
                        id={`comments-${field.id}`}
                        value={field.comments || ""}
                        onChange={(e) => updateField(field.id, { comments: e.target.value })}
                        placeholder="Digite comentários ou observações sobre esta tabela..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {fields.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Adicione uma tabela ao seu documento usando o botão acima
            </div>
          )}

          {/* Campo de texto do rodapé */}
          <Card className="mt-4">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <Label htmlFor="footer-text">
                  Informações de Rodapé (Pagamento, Contato, etc.)
                </Label>
                <Textarea
                  id="footer-text"
                  value={footerText}
                  onChange={(e) => onFooterTextChange(e.target.value)}
                  placeholder="Digite as informações de rodapé..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}