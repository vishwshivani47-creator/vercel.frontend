
'use client';

import React, { useState } from 'react';
import { GradientAsciiIntro } from '@/components/intro/GradientAsciiIntro';
import { HeroSection } from '@/components/sections/HeroSection';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { AnatomyHUDSection } from '@/components/sections/AnatomyHUDSection';
import { ChallengesSection } from '@/components/sections/ChallengesSection';
import { JourneySection } from '@/components/sections/JourneySection';
import { OurWorkSection } from '@/components/sections/OurWorkSection';
import { StatsSection } from '@/components/sections/StatsSection';
import { TechStackSection } from '@/components/sections/TechStackSection';
import { TeamModal } from '@/components/sections/TeamModal';
import { NeuralLinkModal } from '@/components/sections/NeuralLinkModal';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function HomePage() {
  const [selectedPart, setSelectedPart] = useState<string>('head');
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [neuralLinkModalOpen, setNeuralLinkModalOpen] = useState(false);

  // Initialize lightweight IntersectionObserver scroll reveals
  useScrollReveal();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full overflow-hidden bg-cyber-bg">

      {/* OPENING INTRO: FUTURISTIC GRADIENT ASCII EXPERIENCE */}
      <GradientAsciiIntro />

      {/* SECTION 1: HERO (WITH PRIMARY ANIMATED ROBOT IN BACKGROUND BEHIND TEXT) */}
      <HeroSection
        onExploreRobot={() => scrollToSection('features')}
        onMeetTeam={() => setTeamModalOpen(true)}
        selectedPart={selectedPart}
        onSelectPart={(part) => setSelectedPart(part)}
      />

      {/* SECTION 3: SUBSYSTEM MATRIX FEATURES (ROBOT FEATURES) */}
      <FeaturesSection />

      {/* SECTION 4: ANATOMICAL HUD DECONSTRUCTION (SYNCED TO ROBOT MODEL) */}
      <AnatomyHUDSection
        selectedPart={selectedPart}
        onSelectPart={(part) => setSelectedPart(part)}
      />

      {/* SECTION 5: ENGINEERING CHALLENGES (8 CASE STUDIES) */}
      <ChallengesSection />

      {/* SECTION 6: CHRONOLOGICAL ROADMAP / DEVELOPMENT JOURNEY (HOW IT IS MADE) */}
      <JourneySection />

      {/* SECTION 7: OUR WORK // AUTHENTIC PHYSICAL HARDWARE GALLERY */}
      <OurWorkSection />

      {/* SECTION 8: ANIMATED TELEMETRY STATS */}
      <StatsSection />

      {/* SECTION 8: EMBEDDED TECHNOLOGY STACK */}
      <TechStackSection />

      {/* MODALS */}
      <TeamModal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
      />

      <NeuralLinkModal
        isOpen={neuralLinkModalOpen}
        onClose={() => setNeuralLinkModalOpen(false)}
      />

    </div>
  );
}
