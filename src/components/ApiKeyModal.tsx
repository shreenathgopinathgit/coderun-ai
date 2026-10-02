import { Modal } from './ui/Modal'

interface ApiKeyModalProps {
  open: boolean
  onClose: () => void
}

export function ApiKeyModal({ open, onClose }: ApiKeyModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="API Keys">
      <p className="text-sm text-[var(--color-text-dim)]">
        API key management is built in Phase 4.
      </p>
    </Modal>
  )
}