import { useState } from 'react'
import { Mic, Camera, Type, Send, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { getDataExtractionAgent, type ExtractedTransactionData } from '@/services/ai'

interface MultimodalInputModalProps {
  isOpen: boolean
  onClose: () => void
  onExtractedData: (data: ExtractedTransactionData) => void
  primaryColor?: string
}

type InputMode = 'text' | 'voice' | 'image'

/**
 * Modal para entrada multimodal de dados
 * Suporta: texto, voz (áudio), e imagem (foto de documento)
 * Usa Claude API para extrair dados estruturados
 */
export function MultimodalInputModal({
  isOpen,
  onClose,
  onExtractedData,
  primaryColor = '#22c55e',
}: MultimodalInputModalProps) {
  const [mode, setMode] = useState<InputMode>('text')
  const [textInput, setTextInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<Partial<ExtractedTransactionData> | null>(null)

  const agent = getDataExtractionAgent()

  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      toast.error('Digite algo antes de enviar')
      return
    }

    setIsProcessing(true)
    try {
      const data = await agent.extractTransaction(textInput)
      setExtractedData(data)
      toast.success('Dados extraídos com sucesso!')
    } catch (error) {
      toast.error(`Erro ao processar: ${error}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleVoiceInput = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Gravação de áudio não suportada neste navegador')
      return
    }

    try {
      if (!isRecording) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Implementar gravação de áudio aqui
        setIsRecording(true)
        toast.success('Gravação iniciada... fale agora!')
      } else {
        setIsRecording(false)
        toast.success('Gravação concluída, processando...')
        // Enviar áudio para processamento (simulado)
      }
    } catch (error) {
      toast.error(`Erro ao gravar áudio: ${error}`)
    }
  }

  const handleImageInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    try {
      // Converter imagem para base64 para envio
      const reader = new FileReader()
      reader.onload = async (event) => {
        const imageUrl = event.target?.result as string

        // Aqui você chamaria o serviço de OCR
        // const extracted = await extractFromImage(imageUrl)

        toast.success('Imagem processada (simulado)')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error(`Erro ao processar imagem: ${error}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirm = () => {
    if (extractedData) {
      onExtractedData(extractedData as ExtractedTransactionData)
      setExtractedData(null)
      setTextInput('')
      onClose()
    }
  }

  const handleEdit = () => {
    setExtractedData(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Registrar Transação
            <span className="block text-xs text-muted-foreground font-normal mt-1">
              Fale, fotografe ou digite seus dados
            </span>
          </DialogTitle>
        </DialogHeader>

        {!extractedData ? (
          <div className="space-y-4">
            {/* Input Mode Tabs */}
            <div className="flex gap-2">
              <Button
                variant={mode === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('text')}
                className="gap-2"
                style={
                  mode === 'text'
                    ? { backgroundColor: primaryColor }
                    : undefined
                }
              >
                <Type className="size-4" />
                <span className="hidden sm:inline">Texto</span>
              </Button>

              <Button
                variant={mode === 'voice' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('voice')}
                className="gap-2"
                style={
                  mode === 'voice'
                    ? { backgroundColor: primaryColor }
                    : undefined
                }
              >
                <Mic className="size-4" />
                <span className="hidden sm:inline">Áudio</span>
              </Button>

              <Button
                variant={mode === 'image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('image')}
                className="gap-2"
                style={
                  mode === 'image'
                    ? { backgroundColor: primaryColor }
                    : undefined
                }
              >
                <Camera className="size-4" />
                <span className="hidden sm:inline">Foto</span>
              </Button>
            </div>

            {/* Text Input */}
            {mode === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="text-input">Descreva a transação</Label>
                <Input
                  id="text-input"
                  placeholder="Ex: Compra de 50kg de fertilizante NPK da Empresa X por R$ 250"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim() || isProcessing}
                  className="w-full gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Send className="size-4" />
                  {isProcessing ? 'Processando...' : 'Extrair Dados'}
                </Button>
              </div>
            )}

            {/* Voice Input */}
            {mode === 'voice' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  {isRecording
                    ? '🎙️ Gravando... fale agora!'
                    : 'Clique para gravar um áudio curto'}
                </p>
                <Button
                  onClick={handleVoiceInput}
                  disabled={isProcessing}
                  className="w-full gap-2 h-12"
                  variant={isRecording ? 'destructive' : 'outline'}
                >
                  <Mic className="size-5" />
                  {isRecording ? 'Parar Gravação' : 'Iniciar Gravação'}
                </Button>
              </div>
            )}

            {/* Image Input */}
            {mode === 'image' && (
              <div className="space-y-2">
                <Label htmlFor="image-input">Fotografe o documento</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <Camera className="mx-auto mb-2 size-8 text-muted-foreground" />
                  <input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageInput}
                    disabled={isProcessing}
                    className="hidden"
                  />
                  <Button
                    onClick={() => document.getElementById('image-input')?.click()}
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processando...' : 'Selecionar Foto'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Notas fiscais, boletos, rótulos...
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Confirmation View */
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Produto:</span>
                <p className="font-medium">{extractedData.item}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Quantidade:</span>
                <p className="font-medium">
                  {extractedData.quantity} {extractedData.unit}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Valor:</span>
                <p className="font-medium">R$ {extractedData.totalPrice?.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Carteira:</span>
                <p className="font-medium">
                  {extractedData.wallet === 'FARM' ? '🌾 Fazenda' : '👤 Pessoal'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Confiança:</span>
                <p className="font-medium">{((extractedData.confidenceScore || 0) * 100).toFixed(0)}%</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleEdit}
                variant="outline"
                className="flex-1"
              >
                ✏️ Editar
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1"
                style={{ backgroundColor: primaryColor }}
              >
                ✅ Confirmar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
