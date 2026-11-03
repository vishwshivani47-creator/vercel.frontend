'use client';

import React, { useState, useEffect } from 'react';
import { SITE_CONFIG } from '@/config/site';
import { Button } from '@/components/ui/Button';
import { Bot, Users, Activity, Compass, Cpu, ChevronDown } from 'lucide-react';
import { HeroRobot } from '@/components/3d/HeroRobot';
import { useAuth } from '@/hooks/useAuth';

export interface HeroSectionProps {
  onExploreRobot?: () => void;
  onMeetTeam?: () => void;
  selectedPart?: string | null;
  onSelectPart?: (partId: string) => void;
  modelUrl?: string | null;
}

export function HeroSection({
  onExploreRobot,
  onMeetTeam,
  selectedPart,
  onSelectPart,
  modelUrl,
}: HeroSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const fullText = SITE_CONFIG.description;
  const [displayedText, setDisplayedText] = useState('');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(fullText.slice(0, index));
      index++;
      if (index > fullText.length) {
        clearInterval(interval);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [fullText]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-cyber-bg">
      
      {/* Ambient background glows and grid */}
      <div className="absolute inset-0 w-full h-full z-0 flex items-center justify-center pointer-events-none">
        
        {/* Ambient atmospheric cyber glows in Humorphic palette */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[950px] h-[500px] sm:h-[650px] bg-[#086288]/30 rounded-full blur-[170px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[550px] h-[350px] sm:h-[450px] bg-[#4D8DBA]/20 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[280px] sm:w-[400px] h-[280px] bg-[#97D7FF]/15 rounded-full blur-[100px] pointer-events-none" />

        {/* Ambient sci-fi radial grid lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e4e6d_1px,transparent_1px)] [background-size:28px_28px] opacity-25 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-cyber-bg/40 via-transparent to-cyber-bg pointer-events-none" />
      </div>

      {/* =========================================================================
          PRIMARY BACKGROUND ROBOT: LARGE ANIMATED ROBOT BEHIND HERO TEXT
          ========================================================================= */}
      <div className="absolute inset-0 w-full h-full z-[1] flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="relative w-full max-w-6xl h-[85vh] sm:h-[94vh] flex items-center justify-center pointer-events-none hero-robot-chamber">
          <HeroRobot
            opacity={0.76}
            startFrame={60}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* =========================================================================
          FOREGROUND CONTENT: HIGH-LEGIBILITY HERO TEXT & INTERACTIVE CTAS
          ========================================================================= */}
      <div
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center text-center space-y-6 pt-24 pb-16 pointer-events-none transition-transform duration-75 ease-out"
        style={{
          transform: `translateY(${Math.min(scrollY * 0.18, 110)}px)`,
          opacity: Math.max(1 - scrollY / 700, 0),
        }}
      >
        
        {/* Top Tech Badge */}
        <div className="pointer-events-auto inline-flex items-center gap-2.5 rounded-full border border-[#97D7FF]/50 bg-cyber-bg/85 px-4 py-1.5 backdrop-blur-xl shadow-glow-sky">
          <Activity className="h-4 w-4 text-[#97D7FF] animate-pulse" />
          <span className="text-xs font-mono font-medium tracking-wider text-slate-200">
            {isAuthenticated ? (
              <>
                <span className="text-[#97D7FF] font-bold">PILOT ONLINE:</span>{' '}
                <span className="text-[#FFEFC4] font-bold">{user?.username}</span>
                <span className="text-slate-500 mx-2">//</span>
                <span className="text-emerald-400 font-bold">[{user?.role?.toUpperCase() || 'ENGINEER'}]</span>
              </>
            ) : (
              <>
                <span className="text-[#97D7FF] font-bold">ROBOTICS</span> • <span className="text-[#FFEFC4] font-bold">AI</span> • INNOVATION
                <span className="text-slate-500 mx-2">//</span>
                <span className="text-emerald-400 font-bold">[SEC_SYS::ACTV]</span>
              </>
            )}
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight text-white uppercase leading-[1.08] hero-text-glow">
          <span className="block">
            BUILDING <span className="text-[#97D7FF] drop-shadow-[0_0_35px_rgba(151,215,255,0.7)]">MACHINES.</span>
          </span>
          <span className="block">
            <span className="text-[#FFEFC4]">ENGINEERING</span> THE
          </span>
          <span className="block text-[#FFEFC4] drop-shadow-[0_0_35px_rgba(255,239,196,0.6)]">
            FUTURE.
          </span>
        </h1>

        {/* Typing Description with readable backdrop scrim */}
        <div className="hero-sub-scrim px-6 py-3 rounded-2xl backdrop-blur-[2px] max-w-2xl border border-white/5">
          <p className="min-h-[64px] text-base sm:text-lg text-slate-200 font-sans leading-relaxed drop-shadow-md">
            <span>{displayedText}</span>
            <span className="inline-block w-2 h-4 ml-1 bg-[#97D7FF] animate-pulse align-middle" />
          </p>
        </div>

        {/* Coordinates & Metadata */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-1 text-xs font-mono text-slate-300 border-y border-white/10 py-3 w-full max-w-2xl bg-cyber-bg/60 backdrop-blur-md rounded-xl">
          <div className="flex items-center gap-2">
            <Compass className="h-3.5 w-3.5 text-[#97D7FF]" />
            <span>COORD: <strong className="text-white">{SITE_CONFIG.coords}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-humorphic-gold" />
            <span>TIER: <strong className="text-white">{SITE_CONFIG.tier}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Bot className="h-3.5 w-3.5 text-emerald-400" />
            <span>REV: <strong className="text-white">{SITE_CONFIG.version}</strong></span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-4 pt-3">
          <Button
            variant="primary"
            size="lg"
            onClick={onExploreRobot}
            leftIcon={<Bot className="h-5 w-5" />}
            className="shadow-glow hover:shadow-[0_0_35px_rgba(220,47,2,0.65)] font-mono tracking-wider"
          >
            EXPLORE THE ROBOT
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={onMeetTeam}
            leftIcon={<Users className="h-5 w-5" />}
            className="border-white/20 hover:border-humorphic-gold/60 font-mono tracking-wider"
          >
            MEET THE TEAM
          </Button>
        </div>

        {/* Scroll Indicator */}
        <div
          onClick={onExploreRobot}
          className="pointer-events-auto pt-6 flex flex-col items-center gap-1.5 cursor-pointer group text-slate-400 hover:text-white transition-colors"
        >
          <span className="text-[10px] font-mono tracking-widest text-humorphic-gold/80 uppercase group-hover:text-humorphic-gold">
            SCROLL TO DISCOVER
          </span>
          <ChevronDown className="h-4 w-4 text-humorphic-orange animate-bounce" />
        </div>

      </div>

    </section>
  );
}
