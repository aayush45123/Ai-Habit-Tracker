import React, { useRef, useState, useCallback } from "react";

/**
 * TiltCard provides realistic 3D perspective tilt and dynamic specular
 * glare that tracks the user's mouse position.
 */
export default function TiltCard({
  children,
  className = "",
  style = {},
  maxTilt = 12,
  perspective = 1000,
  scale = 1.02,
  glare = true,
}) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
    glareOpacity: 0,
    isHovered: false,
  });

  const handleMouseMove = useCallback(
    (e) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt angles
      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      // Glare position percentage
      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;

      setTransform({
        rotateX,
        rotateY,
        glareX,
        glareY,
        glareOpacity: 0.15,
        isHovered: true,
      });
    },
    [maxTilt]
  );

  const handleMouseEnter = () => {
    setTransform((prev) => ({ ...prev, isHovered: true }));
  };

  const handleMouseLeave = () => {
    setTransform({
      rotateX: 0,
      rotateY: 0,
      glareX: 50,
      glareY: 50,
      glareOpacity: 0,
      isHovered: false,
    });
  };

  return (
    <div
      style={{
        perspective: `${perspective}px`,
        display: "inline-block",
        width: "100%",
        ...style,
      }}
      className={className}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transformStyle: "preserve-3d",
          transform: transform.isHovered
            ? `rotateX(${transform.rotateX.toFixed(2)}deg) rotateY(${transform.rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`
            : "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
          transition: transform.isHovered
            ? "transform 0.1s cubic-bezier(0.2, 0, 0, 1)"
            : "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
          position: "relative",
          willChange: "transform",
        }}
      >
        {children}

        {glare && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              borderRadius: "inherit",
              background: `radial-gradient(circle at ${transform.glareX}% ${transform.glareY}%, rgba(255, 255, 255, ${transform.glareOpacity}), transparent 70%)`,
              transition: transform.isHovered ? "none" : "opacity 0.5s ease",
              mixBlendMode: "overlay",
              zIndex: 10,
            }}
          />
        )}
      </div>
    </div>
  );
}
