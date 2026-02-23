import { useState } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { sogniAuth } from '@/services/sogniAuth';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function EmailVerificationModal({ isOpen, onClose }: EmailVerificationModalProps) {
  const [isChecking, setIsChecking] = useState(false);

  const handleRetry = async () => {
    setIsChecking(true);
    try {
      const result = await sogniAuth.checkExistingSession();
      if (result) {
        onClose();
      }
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Email Verification Required" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-white/60">
          Your Sogni account email needs to be verified before you can generate images.
          Please check your inbox and verify your email address.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            fullWidth
            onClick={() => window.open('https://app.sogni.ai', '_blank')}
          >
            Go to Sogni App
          </Button>
          <Button
            variant="outline"
            fullWidth
            loading={isChecking}
            onClick={handleRetry}
          >
            {isChecking ? 'Checking...' : "I've Verified \u2014 Try Again"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default EmailVerificationModal;
