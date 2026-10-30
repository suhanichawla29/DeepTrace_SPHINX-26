import React from 'react';
import { UploadCloud, Cpu, CheckSquare } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      step: '01',
      icon: <UploadCloud size={24} className="step-icon" />,
      title: 'Upload Content',
      description: 'Select the media you want to examine. DeepTrace accepts high-resolution images in PNG, JPG, JPEG, and WEBP formats.',
      note: 'Client-side preview with secure memory buffering',
    },
    {
      step: '02',
      icon: <Cpu size={24} className="step-icon" />,
      title: 'AI Analysis',
      description: 'The detection system processes the uploaded content using a fine-tuned Vision Transformer (ViT-Base) trained on the CIFAKE dataset.',
      note: 'Evaluates 16×16 visual patch token embeddings on CPU',
    },
    {
      step: '03',
      icon: <CheckSquare size={24} className="step-icon" />,
      title: 'Review Results',
      description: 'Examine the predicted class label (REAL or FAKE) and inspect calibrated probability scores across both classes.',
      note: 'Transparent confidence breakdown without guesswork',
    },
  ];

  return (
    <section className="how-it-works-section" id="how-it-works">
      <div className="container">
        <div className="section-header-centered">
          <span className="section-eyebrow">VERIFICATION WORKFLOW</span>
          <h2 className="section-title">How DeepTrace Works</h2>
          <p className="section-subtitle">
            A three-step verification pipeline powered by deep computer vision architectures.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map((item, idx) => (
            <div key={idx} className="step-card">
              <div className="step-top-row">
                <div className="step-icon-wrap">
                  {item.icon}
                </div>
                <span className="step-number">{item.step}</span>
              </div>

              <h3 className="step-title">{item.title}</h3>
              <p className="step-description">{item.description}</p>

              <div className="step-footer-note">
                <span className="note-dash">—</span>
                <span className="note-text">{item.note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

