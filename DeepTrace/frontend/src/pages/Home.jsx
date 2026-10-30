import React from 'react';
import { ScanEye, AudioWaveform, Video, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';
import Hero from '../components/Hero';
import DetectionCard from '../components/DetectionCard';
import HowItWorks from '../components/HowItWorks';
import {
  ImageIllustration,
  AudioIllustration,
  VideoIllustration,
  MessageIllustration,
} from '../components/CardIllustrations';

export default function Home() {
  const detectionModules = [
    {
      id: 'image',
      icon: <ScanEye size={22} className="card-header-icon active-icon" />,
      title: 'Image Detection',
      description: 'Analyze images to identify potentially AI-generated or synthetic visual content.',
      availability: 'available',
      actionText: 'Explore Image Detection',
      path: '/image-detection',
      illustration: <ImageIllustration />,
    },
    {
      id: 'audio',
      icon: <AudioWaveform size={22} className="card-header-icon" />,
      title: 'Audio Detection',
      description: 'Examine audio recordings to identify potentially synthetic or manipulated voices.',
      availability: 'coming-soon',
      actionText: 'Coming Soon',
      path: '/audio-detection',
      illustration: <AudioIllustration />,
    },
    {
      id: 'video',
      icon: <Video size={22} className="card-header-icon" />,
      title: 'Video Detection',
      description: 'Analyze videos to identify potentially manipulated or AI-generated visual content.',
      availability: 'coming-soon',
      actionText: 'Coming Soon',
      path: '/video-detection',
      illustration: <VideoIllustration />,
    },
    {
      id: 'message',
      icon: <MessageSquare size={22} className="card-header-icon" />,
      title: 'Message Detection',
      description: 'Examine messages to identify suspicious, misleading or potentially AI-generated content.',
      availability: 'coming-soon',
      actionText: 'Coming Soon',
      path: '/message-detection',
      illustration: <MessageIllustration />,
    },
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <Hero />

      {/* 4 Detection Cards Section (Primary visual focus) */}
      <section className="detection-modules-section" id="detection-modules">
        <div className="container">
          <div className="section-header-centered">
            <span className="section-eyebrow">DETECTION VECTORS</span>
            <h2 className="section-title">Multi-Modal Verification Modules</h2>
            <p className="section-subtitle">
              DeepTrace evaluates digital media across four key threat surfaces. Image Detection is operational now, with remaining vectors scheduled for upcoming phases.
            </p>
          </div>

          {/* Desktop 2x2 Grid / Responsive */}
          <div className="modules-2x2-grid">
            {detectionModules.map((module) => (
              <DetectionCard
                key={module.id}
                id={module.id}
                icon={module.icon}
                title={module.title}
                description={module.description}
                availability={module.availability}
                actionText={module.actionText}
                path={module.path}
                illustration={module.illustration}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How DeepTrace Works Section */}
      <HowItWorks />

      {/* Midterm Milestone Callout Banner */}
      <section className="midterm-banner-section">
        <div className="container">
          <div className="midterm-banner-card">
            <div className="banner-left">
              <div className="banner-icon-badge">
                <ShieldCheck size={24} />
              </div>
              <div className="banner-text">
                <h3 className="banner-heading">DeepTrace Midterm Milestone Architecture</h3>
                <p className="banner-body">
                  Currently running Vision Transformer classification on local CPU with the fine-tuned CIFAKE model (<code className="banner-code">aaronkantrowitz/ai-image-detection</code>).
                </p>
              </div>
            </div>
            <div className="banner-right">
              <a href="/image-detection" className="btn btn-primary btn-sm">
                <span>Test Live Image Model</span>
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
