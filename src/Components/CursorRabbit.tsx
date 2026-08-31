"use client";

import { useEffect } from "react";

type RabbitPose = "idle" | "alert" | "runA" | "runB" | "sleep";

function rabbitSvg(pose: RabbitPose) {
  const dash = 'stroke-dasharray="2.5 2.5"';
  const stroke = 'stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const hop = pose === "runB" ? 1 : 0;
  const legA = pose === "runB" ? 22 : 24;
  const legB = pose === "runB" ? 24 : 22;

  return `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="display:block">
      <ellipse cx="16" cy="29" rx="7" ry="1.5" fill="rgba(0,0,0,0.18)" stroke="none"/>
      <path d="M10 ${5 - hop} C10 1 7 0 7 4 C7 0 4 1 4 ${5 - hop} C4 9 7 11 10 ${9 - hop}" ${stroke} ${dash}/>
      <path d="M22 ${5 - hop} C22 1 25 0 25 4 C25 0 28 1 28 ${5 - hop} C28 9 25 11 22 ${9 - hop}" ${stroke} ${dash}/>
      <circle cx="16" cy="${16 - hop}" r="8" ${stroke} ${dash}/>
      <circle cx="13.5" cy="${15 - hop}" r="1.1" fill="currentColor" stroke="none"/>
      <circle cx="18.5" cy="${15 - hop}" r="1.1" fill="currentColor" stroke="none"/>
      <path d="M14.5 ${18 - hop} Q16 ${19.5 - hop} 17.5 ${18 - hop}" ${stroke} ${dash}/>
      <ellipse cx="16" cy="${22 - hop}" rx="5.5" ry="4.5" ${stroke} ${dash}/>
      <path d="M12 ${legA - hop} L11 ${28 - hop}" ${stroke} ${dash}/>
      <path d="M20 ${legB - hop} L21 ${28 - hop}" ${stroke} ${dash}/>
      ${pose === "sleep" ? `<path d="M10 17 Q16 14 22 17" ${stroke} ${dash}/>` : ""}
      ${pose === "alert" ? `<path d="M8 12 L6 8 M24 12 L26 8" ${stroke} ${dash}/>` : ""}
    </svg>
  `;
}

const CursorRabbit = () => {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (typeof window.requestAnimationFrame !== "function") return;
    if (document.getElementById("cursor-rabbit")) return;

    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const rabbitEl = document.createElement("div");
    let rabbitPosX = 32;
    let rabbitPosY = 32;
    let mousePosX = 0;
    let mousePosY = 0;
    let frameCount = 0;
    let idleTime = 0;
    let facingRight = true;
    let idleAnimation: "sleep" | null = null;
    let idleAnimationFrame = 0;

    let isDragging = false;
    let draggingPointerId: number | null = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    const hasPointerEvents = "PointerEvent" in window;
    const rabbitSpeed = 10;
    let currentPose: RabbitPose = "idle";

    const isDarkTheme = () =>
      document.documentElement.classList.contains("dark");

    const applyThemeStyles = () => {
      const dark = isDarkTheme();
      rabbitEl.style.color = dark ? "#f4f4f5" : "#171717";
      rabbitEl.style.filter = dark
        ? "drop-shadow(0 1px 2px rgba(0,0,0,0.45))"
        : "drop-shadow(0 1px 2px rgba(255,255,255,0.9)) drop-shadow(0 0 1px rgba(0,0,0,0.15))";
    };

    const setPose = (pose: RabbitPose) => {
      currentPose = pose;
      applyThemeStyles();
      rabbitEl.innerHTML = rabbitSvg(pose);
      rabbitEl.style.transform = facingRight ? "scaleX(1)" : "scaleX(-1)";
    };

    const resetIdleAnimation = () => {
      idleAnimation = null;
      idleAnimationFrame = 0;
    };

    const idle = () => {
      idleTime += 1;

      if (
        idleTime > 10 &&
        Math.floor(Math.random() * 200) === 0 &&
        idleAnimation === null
      ) {
        idleAnimation = "sleep";
      }

      if (idleAnimation === "sleep") {
        setPose("sleep");
        idleAnimationFrame += 1;
        if (idleAnimationFrame > 180) resetIdleAnimation();
        return;
      }

      setPose("idle");
    };

    const frame = () => {
      frameCount += 1;
      if (isDragging) return;

      const diffX = rabbitPosX - mousePosX;
      const diffY = rabbitPosY - mousePosY;
      const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

      if (distance < rabbitSpeed || distance < 48) {
        idle();
        return;
      }

      idleAnimation = null;
      idleAnimationFrame = 0;

      if (idleTime > 1) {
        setPose("alert");
        idleTime = Math.min(idleTime, 7);
        idleTime -= 1;
        return;
      }

      facingRight = diffX < 0;
      setPose(frameCount % 2 === 0 ? "runA" : "runB");

      rabbitPosX -= (diffX / distance) * rabbitSpeed;
      rabbitPosY -= (diffY / distance) * rabbitSpeed;

      rabbitPosX = Math.min(Math.max(16, rabbitPosX), window.innerWidth - 16);
      rabbitPosY = Math.min(Math.max(16, rabbitPosY), window.innerHeight - 16);

      rabbitEl.style.left = `${rabbitPosX - 16}px`;
      rabbitEl.style.top = `${rabbitPosY - 16}px`;
    };

    let lastFrameTimestamp = 0;
    const onAnimationFrame = (timestamp: number) => {
      if (!rabbitEl.isConnected) return;
      if (!lastFrameTimestamp) lastFrameTimestamp = timestamp;
      if (timestamp - lastFrameTimestamp > 100) {
        lastFrameTimestamp = timestamp;
        frame();
      }
      window.requestAnimationFrame(onAnimationFrame);
    };

    const handleMouseMove = (event: MouseEvent) => {
      mousePosX = event.clientX;
      mousePosY = event.clientY;
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!event.isPrimary) return;
      isDragging = true;
      draggingPointerId = event.pointerId;
      const leftPos = rabbitPosX - 16;
      const topPos = rabbitPosY - 16;
      dragOffsetX = event.clientX - leftPos;
      dragOffsetY = event.clientY - topPos;
      rabbitEl.setPointerCapture?.(event.pointerId);
      rabbitEl.style.cursor = "grabbing";
      idleTime = 0;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging || event.pointerId !== draggingPointerId) return;
      const left = event.clientX - dragOffsetX;
      const top = event.clientY - dragOffsetY;
      rabbitPosX = left + 16;
      rabbitPosY = top + 16;
      rabbitPosX = Math.min(Math.max(16, rabbitPosX), window.innerWidth - 16);
      rabbitPosY = Math.min(Math.max(16, rabbitPosY), window.innerHeight - 16);
      mousePosX = event.clientX;
      mousePosY = event.clientY;
      rabbitEl.style.left = `${rabbitPosX - 16}px`;
      rabbitEl.style.top = `${rabbitPosY - 16}px`;
    };

    const endDrag = (event?: PointerEvent) => {
      if (!isDragging || (event && event.pointerId !== draggingPointerId)) return;
      if (event) {
        try {
          rabbitEl.releasePointerCapture?.(event.pointerId);
        } catch {
          // ignore
        }
      }
      isDragging = false;
      draggingPointerId = null;
      rabbitEl.style.cursor = "grab";
      mousePosX = rabbitPosX;
      mousePosY = rabbitPosY;
    };

    rabbitEl.id = "cursor-rabbit";
    rabbitEl.setAttribute("aria-hidden", "true");
    Object.assign(rabbitEl.style, {
      width: "32px",
      height: "32px",
      position: "fixed",
      pointerEvents: "auto",
      touchAction: "none",
      userSelect: "none",
      cursor: "grab",
      left: `${rabbitPosX - 16}px`,
      top: `${rabbitPosY - 16}px`,
      zIndex: "2147483647",
    });

    const themeObserver = new MutationObserver(() => {
      setPose(currentPose);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    setPose("idle");
    document.body.appendChild(rabbitEl);
    document.addEventListener("mousemove", handleMouseMove);

    if (hasPointerEvents) {
      rabbitEl.addEventListener("pointerdown", handlePointerDown);
      rabbitEl.addEventListener("pointermove", handlePointerMove);
      rabbitEl.addEventListener("pointerup", endDrag);
      rabbitEl.addEventListener("pointercancel", endDrag);
      window.addEventListener("pointerup", endDrag);
    }

    window.requestAnimationFrame(onAnimationFrame);

    return () => {
      themeObserver.disconnect();
      document.removeEventListener("mousemove", handleMouseMove);
      if (hasPointerEvents) {
        rabbitEl.removeEventListener("pointerdown", handlePointerDown);
        rabbitEl.removeEventListener("pointermove", handlePointerMove);
        rabbitEl.removeEventListener("pointerup", endDrag);
        rabbitEl.removeEventListener("pointercancel", endDrag);
        window.removeEventListener("pointerup", endDrag);
      }
      rabbitEl.remove();
    };
  }, []);

  return null;
};

export default CursorRabbit;
