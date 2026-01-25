import { ref } from 'vue'

export interface Receipt {
  id: string
  file_path: string
  file_name: string
  mime_type: string
  uploaded_at: string
}

const receipts = ref<Map<string, Receipt>>(new Map())
const isLoading = ref(false)
const error = ref<string | null>(null)

export function useReceiptStore() {
  const addReceipt = (receipt: Receipt) => {
    receipts.value.set(receipt.id, receipt)
  }

  const getReceipt = (id: string): Receipt | undefined => {
    return receipts.value.get(id)
  }

  const removeReceipt = (id: string) => {
    receipts.value.delete(id)
  }

  const clearReceipts = () => {
    receipts.value.clear()
  }

  return {
    receipts,
    isLoading,
    error,
    addReceipt,
    getReceipt,
    removeReceipt,
    clearReceipts,
  }
}
