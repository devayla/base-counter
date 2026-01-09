/**
 * Captures the Counter share image (Global Counter + User Card)
 * Creates a canvas-based image for sharing
 * Style: Clean, minimalist with user avatar, name, glowing counter value
 */

// Helper function to draw default avatar
function drawDefaultAvatar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  // Draw gradient circle with glow effect
  const gradient = ctx.createRadialGradient(x + size / 2, y + size / 2, 0, x + size / 2, y + size / 2, size / 2);
  gradient.addColorStop(0, '#fbbf24');
  gradient.addColorStop(0.7, '#f59e0b');
  gradient.addColorStop(1, '#d97706');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw user icon
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.4}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('👤', x + size / 2, y + size / 2);
}

export async function captureCounterShareImage(
  globalCounter: bigint | undefined,
  username: string,
  userIncrementCount: number,
  userPfpUrl?: string,
  totalRewards?: number | null
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Format counter with commas
      const counterText = globalCounter 
        ? globalCounter.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') 
        : '0';
      
      // Function to finish the image (moved outside to avoid block-scoped function declaration)
      const finishImage = () => {
        // Calculate positions with proper spacing
        // Avatar ends at: avatarY + avatarSize
        // Username starts after avatar + glow space
        const usernameY = avatarY + avatarSize + 50;
        
        // Username (below avatar with good spacing)
        ctx.fillStyle = '#4b5563';
        ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(username, 600, usernameY);
        
        // Username text height is approximately 40px
        // Add more spacing before counter (top padding)
        const usernameHeight = 40;
        const spacingBetween = 120; // Increased top padding
        const counterY = usernameY + usernameHeight + spacingBetween;
        
        // Counter font size (increased)
        const counterFontSize = 180;
        
        // Draw glow effect layers (behind the main text)
        ctx.save();
        for (let i = 0; i < 8; i++) {
          ctx.shadowBlur = 20 + (i * 4);
          ctx.shadowColor = 'rgba(251, 191, 36, 0.4)';
          ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
          ctx.font = `bold ${counterFontSize}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(counterText, 600, counterY);
        }
        ctx.restore();
        
        // Main counter text (bright yellow/gold)
        ctx.fillStyle = '#fbbf24';
        ctx.font = `bold ${counterFontSize}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(counterText, 600, counterY);

        // My Count (below counter with more bottom padding) - Cooler, shorter text
        const counterHeight = counterFontSize * 0.7; // Approximate height of counter text
        const bottomPadding = 120; // Increased bottom padding
        ctx.fillStyle = '#6b7280'; // Increased opacity (darker gray)
        ctx.font = 'bold 28px system-ui, -apple-system, sans-serif'; // Increased size
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`My Count: ${userIncrementCount}`, 600, counterY + counterHeight / 2 + bottomPadding);

        // Total Rewards text (if available)
        const totalIncrementsY = counterY + counterHeight / 2 + bottomPadding;
        const totalIncrementsHeight = 35;
        let currentY = totalIncrementsY + totalIncrementsHeight + 20;
        
     

        // Bottom instruction text
        ctx.fillStyle = '#6b7280'; // Increased opacity (darker gray)
        ctx.font = 'bold 24px system-ui, -apple-system, sans-serif'; // Increased size
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Increment the counter on Base', 600, currentY);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          'image/png',
          0.95
        );
      };

      // Clean off-white background
      ctx.fillStyle = '#fafafa';
      ctx.fillRect(0, 0, 1200, 800);

      // Vertical border lines (left and right)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 800);
      ctx.moveTo(1200, 0);
      ctx.lineTo(1200, 800);
      ctx.stroke();

      // User Avatar (Top Center)
      const avatarSize = 120;
      const avatarX = (1200 - avatarSize) / 2;
      const avatarY = 100;

      // Avatar glow effect (behind avatar)
      const glowGradient = ctx.createRadialGradient(
        avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2,
        avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize
      );
      glowGradient.addColorStop(0, 'rgba(251, 191, 36, 0.3)');
      glowGradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize, 0, Math.PI * 2);
      ctx.fill();

      if (userPfpUrl) {
        // Try to load and draw user's profile picture
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // Draw circular avatar with light blue background
          ctx.fillStyle = '#bfdbfe';
          ctx.beginPath();
          ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw user image
          ctx.save();
          ctx.beginPath();
          ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
          ctx.restore();
          
          // Yellow halo ring around avatar
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 2, 0, Math.PI * 2);
          ctx.stroke();
          
          finishImage();
        };
        img.onerror = () => {
          // Fallback: draw default avatar
          drawDefaultAvatar(ctx, avatarX, avatarY, avatarSize);
          finishImage();
        };
        img.src = userPfpUrl;
      } else {
        // Light blue background for default avatar
        ctx.fillStyle = '#bfdbfe';
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        drawDefaultAvatar(ctx, avatarX, avatarY, avatarSize);
        finishImage();
      }
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Unknown error capturing counter share'));
    }
  });
}
