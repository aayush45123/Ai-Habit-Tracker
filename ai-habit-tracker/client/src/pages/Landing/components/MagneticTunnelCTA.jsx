import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, CheckCircle2, ShieldCheck, Lock } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function MagneticTunnelCTA() {
  const containerRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        {
          transformPerspective: 1200,
          rotateX: 22,
          scale: 0.88,
          y: 70,
          opacity: 0.5,
        },
        {
          rotateX: 0,
          scale: 1,
          y: 0,
          opacity: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            end: "top 40%",
            scrub: 0.6,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      style={{
        maxWidth: "1240px",
        margin: "0 auto",
        padding: "6rem 1.5rem",
        textAlign: "center",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div
        ref={cardRef}
        style={{
          maxWidth: "880px",
          margin: "0 auto",
          padding: "4.5rem 3rem",
          backgroundColor: "#000000",
          color: "#ffffff",
          border: "3.5px solid #000000",
          boxShadow: "16px 16px 0 0 rgba(0, 0, 0, 0.4)",
          borderRadius: "16px",
          transformStyle: "preserve-3d",
          willChange: "transform, opacity",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(2.4rem, 4.5vw, 3.4rem)",
            fontWeight: 900,
            color: "#ffffff",
            margin: "0 0 1.25rem 0",
            letterSpacing: "-1.5px",
            lineHeight: 1.1,
          }}
        >
          Ready to Rewire Your Potential?
        </h2>

        <p
          style={{
            fontSize: "clamp(1.05rem, 1.8vw, 1.25rem)",
            lineHeight: 1.65,
            color: "#cccccc",
            margin: "0 auto 2.5rem",
            maxWidth: "640px",
          }}
        >
          Join over 10,000+ ambitious humans building unbreakable daily habits with
          AI guidance. Free forever core plan. No credit card required.
        </p>

        <div
          style={{
            display: "flex",
            gap: "1.25rem",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "2.5rem",
          }}
        >
          <Link
            to="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "1.15rem 2.75rem",
              backgroundColor: "#ffffff",
              color: "#000000",
              border: "2px solid #ffffff",
              boxShadow: "5px 5px 0 0 rgba(255, 255, 255, 0.4)",
              borderRadius: "8px",
              fontSize: "1.05rem",
              fontWeight: 900,
              textDecoration: "none",
              textTransform: "uppercase",
              letterSpacing: "0.6px",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            <span>Start Free in 15s</span>
            <ArrowRight size={20} strokeWidth={3} />
          </Link>

          <Link
            to="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "1.15rem 2.25rem",
              backgroundColor: "transparent",
              color: "#ffffff",
              border: "2px solid #ffffff",
              borderRadius: "8px",
              fontSize: "1.05rem",
              fontWeight: 800,
              textDecoration: "none",
              textTransform: "uppercase",
              letterSpacing: "0.6px",
              transition: "background-color 0.15s ease",
            }}
          >
            <span>Log In to Account</span>
          </Link>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "2.5rem",
            flexWrap: "wrap",
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "#bbbbbb",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <CheckCircle2 size={16} strokeWidth={2.75} color="#27c93f" />
            <span>Free forever core plan</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck size={16} strokeWidth={2.75} color="#27c93f" />
            <span>No credit card required</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Lock size={16} strokeWidth={2.75} color="#27c93f" />
            <span>Google 1-Click authorization</span>
          </div>
        </div>
      </div>
    </section>
  );
}
