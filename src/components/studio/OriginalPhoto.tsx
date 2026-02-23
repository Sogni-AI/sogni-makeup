import { motion } from 'framer-motion';

interface OriginalPhotoProps {
  imageUrl: string;
}

function OriginalPhoto({ imageUrl }: OriginalPhotoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative h-full w-full"
    >
      <img
        src={imageUrl}
        alt="Your original photo"
        className="h-full w-full object-contain"
      />
    </motion.div>
  );
}

export default OriginalPhoto;
