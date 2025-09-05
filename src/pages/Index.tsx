import React, { useEffect, useState, useContext } from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import StudentTestimonials from '../components/StudentTestimonials';
import Footer from '../components/Footer';
import FeaturesRoadmap from '../components/FeaturesRoadmap';
import StudentChallenges from '../components/StudentChallenges';
import ResearchForm from '../components/research/ResearchForm';
import PricingPlans from '../components/PricingPlans';
import { AuthContext } from '@/App';
import { useResearchCost } from '@/hooks/useResearchCost';

const Index = () => {
  const { researchCost } = useResearchCost();
  const { user } = useContext(AuthContext);
  
  return (
    <div className="min-h-screen flex flex-col bg-bahthali-50/10">
      <Header />
      
      <main className="flex-1">
        <HeroSection />
        
        <div className="absolute mx-auto px-4 py-12 -mt-6 relative z-10 bg-gradient-to-b from-white to-bahthali-50">
          <ResearchForm />
        </div>
        
        {/* Show PricingPlans if research is not free */}
        {researchCost > 0 && <PricingPlans />}
        
        <StudentChallenges />
        <FeaturesRoadmap />
        <FeaturesSection />
        <StudentTestimonials />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;