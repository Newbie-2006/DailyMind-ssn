import { useState } from 'react';
import { Leaf } from 'lucide-react';

export interface MemoryImageProps {
  src?: string;
  alt: string;
  className?: string;
  /** Eager only for the one image above the fold; everything else waits. */
  priority?: boolean;
  rounded?: string;
}

/**
 * Photography with a calm fallback. A memory without a picture still deserves
 * a surface that looks intentional rather than broken.
 */
export function MemoryImage({
  src,
  alt,
  className = '',
  priority = false,
  rounded = 'rounded-2xl',
}: MemoryImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-sage-wash text-sage ${rounded} ${className}`}
        role="img"
        aria-label={alt}
      >
        <Leaf size={22} strokeWidth={1.5} aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={`bg-surface-sunk object-cover ${rounded} ${className}`}
    />
  );
}
