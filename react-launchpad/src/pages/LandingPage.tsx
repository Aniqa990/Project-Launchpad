import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Star, Users, Briefcase, TrendingUp, Rocket, Brain, Shield, Clock, BarChart3, MessageSquare, X, ChevronLeft, ChevronRight, Quote, CheckCircle, Zap, Target } from 'lucide-react';

function LandingPage() {
  const [showDemo, setShowDemo] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [userReview, setUserReview] = useState({ name: '', email: '', rating: 5, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Matching',
      description: 'Our intelligent algorithm matches freelancers with projects based on skills, experience, and compatibility.',
      color: 'from-blue-500 to-indigo-600',
      detailedInfo: {
        subtitle: 'Smart Matching Technology',
        overview: 'Our advanced AI analyzes over 50 data points to create perfect freelancer-project matches with 95% accuracy.',
        benefits: [
          'Skill compatibility analysis using machine learning',
          'Experience level matching for optimal project outcomes',
          'Personality and work style compatibility assessment',
          'Time zone and availability optimization',
          'Budget and rate alignment',
          'Past project success rate consideration'
        ],
        howItWorks: [
          'Project requirements are analyzed using natural language processing',
          'Freelancer profiles are scored against project needs',
          'Machine learning algorithms consider historical success patterns',
          'Real-time availability and preferences are factored in',
          'Top matches are ranked and presented with compatibility scores'
        ],
        stats: {
          accuracy: '95%',
          timeReduction: '80%',
          successRate: '98%'
        }
      }
    },
    {
      icon: Users,
      title: 'Talent Pool',
      description: 'Access thousands of verified freelancers across design, development, marketing, and more.',
      color: 'from-indigo-500 to-purple-600',
      detailedInfo: {
        subtitle: 'Global Network of Verified Professionals',
        overview: 'Connect with 50,000+ pre-vetted freelancers across 100+ skill categories, all verified through our rigorous screening process.',
        benefits: [
          'Comprehensive skill verification and testing',
          'Background checks and identity verification',
          'Portfolio review and quality assessment',
          'Client feedback and rating system',
          'Continuous performance monitoring',
          'Specialized expertise in niche areas'
        ],
        howItWorks: [
          'Freelancers undergo multi-stage verification process',
          'Skills are tested through practical assessments',
          'Portfolios are reviewed by industry experts',
          'Identity and credentials are verified',
          'Ongoing performance tracking ensures quality'
        ],
        stats: {
          freelancers: '50,000+',
          categories: '100+',
          verificationRate: '99%'
        }
      }
    },
    {
      icon: Clock,
      title: 'Time Tracking',
      description: 'Built-in time tracking and milestone management to keep projects on schedule and budget.',
      color: 'from-purple-500 to-pink-600',
      detailedInfo: {
        subtitle: 'Comprehensive Project Management',
        overview: 'Advanced time tracking and milestone management system that ensures projects stay on schedule and within budget.',
        benefits: [
          'Automatic time tracking with screenshot verification',
          'Milestone-based project breakdown',
          'Real-time progress monitoring',
          'Budget tracking and alerts',
          'Detailed reporting and analytics',
          'Integration with popular project management tools'
        ],
        howItWorks: [
          'Freelancers use our desktop app for automatic time tracking',
          'Projects are broken down into manageable milestones',
          'Progress is tracked in real-time with visual indicators',
          'Clients receive regular updates and reports',
          'Automated alerts for budget and deadline concerns'
        ],
        stats: {
          accuracy: '99.9%',
          onTimeDelivery: '94%',
          budgetCompliance: '96%'
        }
      }
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Protected payments with escrow service ensuring freelancers get paid and clients get results.',
      color: 'from-pink-500 to-red-600',
      detailedInfo: {
        subtitle: 'Bank-Level Security & Escrow Protection',
        overview: 'Military-grade encryption and escrow services protect both clients and freelancers throughout the entire project lifecycle.',
        benefits: [
          'Escrow protection for all transactions',
          'Multiple payment methods supported',
          'Automatic milestone-based releases',
          'Dispute resolution system',
          'Fraud protection and monitoring',
          'Instant payment processing'
        ],
        howItWorks: [
          'Funds are held securely in escrow until milestones are completed',
          'Automatic payment release upon milestone approval',
          'Dispute resolution team handles any conflicts',
          'Multiple payment methods including cards, bank transfers, and digital wallets',
          'Real-time transaction monitoring for fraud prevention'
        ],
        stats: {
          security: '256-bit SSL',
          disputeResolution: '24hrs',
          paymentSuccess: '99.8%'
        }
      }
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights into project progress, team performance, and budget utilization.',
      color: 'from-green-500 to-teal-600',
      detailedInfo: {
        subtitle: 'Data-Driven Project Insights',
        overview: 'Powerful analytics dashboard providing real-time insights into project performance, team productivity, and business metrics.',
        benefits: [
          'Real-time project progress tracking',
          'Team performance analytics',
          'Budget utilization monitoring',
          'ROI calculation and reporting',
          'Predictive analytics for project outcomes',
          'Custom reporting and data export'
        ],
        howItWorks: [
          'Data is collected from all project activities in real-time',
          'Advanced algorithms analyze patterns and trends',
          'Visual dashboards present insights in easy-to-understand formats',
          'Automated reports are generated and delivered',
          'Predictive models forecast project outcomes'
        ],
        stats: {
          dataPoints: '1M+',
          reportTypes: '25+',
          accuracy: '97%'
        }
      }
    },
    {
      icon: MessageSquare,
      title: 'Real-time Communication',
      description: 'Seamless collaboration with integrated messaging, file sharing, and video calls.',
      color: 'from-teal-500 to-cyan-600',
      detailedInfo: {
        subtitle: 'Unified Communication Platform',
        overview: 'All-in-one communication suite that keeps teams connected with instant messaging, file sharing, and HD video conferencing.',
        benefits: [
          'Instant messaging with read receipts',
          'HD video conferencing for up to 50 participants',
          'Secure file sharing with version control',
          'Screen sharing and collaborative whiteboard',
          'Integration with popular communication tools',
          'Mobile apps for communication on the go'
        ],
        howItWorks: [
          'Built-in messaging system connects all project stakeholders',
          'Video calls can be initiated with one click',
          'Files are shared securely with automatic backup',
          'All communications are logged for project history',
          'Mobile apps ensure connectivity anywhere'
        ],
        stats: {
          uptime: '99.9%',
          messageDelivery: '<1sec',
          videoQuality: '4K HD'
        }
      }
    }
  ];

  const testimonials = [
    {
      name: 'Michael Chen',
      role: 'Startup Founder',
      company: 'TechFlow Inc.',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      content: 'Project Launchpad transformed how we handle projects. The AI matching is incredibly accurate, and we found our perfect designer within hours.',
      rating: 5,
      verified: true
    },
    {
      name: 'Sarah Williams',
      role: 'Marketing Director',
      company: 'Growth Labs',
      avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      content: 'The platform made it so easy to manage multiple freelancers. The time tracking and payment system work flawlessly.',
      rating: 5,
      verified: true
    },
    {
      name: 'David Rodriguez',
      role: 'Freelance Developer',
      company: 'Independent',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      content: 'As a freelancer, this platform connects me with high-quality projects that match my skills perfectly. The AI really works!',
      rating: 5,
      verified: true
    },
    {
      name: 'Emily Johnson',
      role: 'Product Manager',
      company: 'InnovateCorp',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      content: 'The milestone tracking and project management features are outstanding. We completed our project 2 weeks ahead of schedule.',
      rating: 5,
      verified: true
    }
  ];

  const demoSteps = [
    {
      title: 'Create Your Project',
      description: 'Post your project with detailed requirements and budget',
      image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'
    },
    {
      title: 'AI Matches Freelancers',
      description: 'Our AI analyzes skills and compatibility to find perfect matches',
      image: 'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'
    },
    {
      title: 'Collaborate & Track Progress',
      description: 'Work together with built-in tools for communication and project management',
      image: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'
    },
    {
      title: 'Secure Payment & Delivery',
      description: 'Get your project delivered on time with secure milestone-based payments',
      image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'
    }
  ];

  const [currentDemoStep, setCurrentDemoStep] = useState(0);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const nextDemoStep = () => {
    setCurrentDemoStep((prev) => (prev + 1) % demoSteps.length);
  };

  const prevDemoStep = () => {
    setCurrentDemoStep((prev) => (prev - 1 + demoSteps.length) % demoSteps.length);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit to an API
    console.log('Review submitted:', userReview);
    alert('Thank you for your review! It will be published after moderation.');
    setShowReviewForm(false);
    setUserReview({ name: '', email: '', rating: 5, comment: '' });
  };

  const openFeatureModal = (feature: any) => {
    setSelectedFeature(feature);
    setShowFeatureModal(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Project Launchpad
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <Link 
                to="/login"
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium px-4 py-2"
              >
                Log In
              </Link>
              <Link 
                to="/signup"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-blue-200">
                <Star className="w-4 h-4 fill-current" />
                <span>AI-Powered Matching Technology</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Find & Manage{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Freelance Projects
                </span>{' '}
                with AI
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Connect talented freelancers with amazing projects using our intelligent matching system. 
                Streamline your workflow, track progress, and get results faster than ever.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Link 
                  to="/auth"
                  className="group bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-2"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button 
                  onClick={() => setShowDemo(true)}
                  className="group bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Play className="w-5 h-5" />
                  <span>Watch Demo</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6 text-center lg:text-left">
                <div>
                  <div className="flex items-center justify-center lg:justify-start space-x-2 text-2xl font-bold text-blue-600 mb-1">
                    <Users className="w-6 h-6" />
                    <span>50K+</span>
                  </div>
                  <p className="text-gray-600 text-sm">Active Users</p>
                </div>
                <div>
                  <div className="flex items-center justify-center lg:justify-start space-x-2 text-2xl font-bold text-indigo-600 mb-1">
                    <Briefcase className="w-6 h-6" />
                    <span>10K+</span>
                  </div>
                  <p className="text-gray-600 text-sm">Projects Completed</p>
                </div>
                <div>
                  <div className="flex items-center justify-center lg:justify-start space-x-2 text-2xl font-bold text-purple-600 mb-1">
                    <TrendingUp className="w-6 h-6" />
                    <span>98%</span>
                  </div>
                  <p className="text-gray-600 text-sm">Success Rate</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative bg-gradient-to-br from-blue-100 to-indigo-200 rounded-3xl p-8 shadow-2xl">
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 shadow-lg transform hover:scale-105 transition-transform duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Sarah Johnson</h3>
                        <p className="text-sm text-gray-600">UI/UX Designer</p>
                      </div>
                      <div className="ml-auto">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">4.9</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-lg transform hover:scale-105 transition-transform duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Mobile App Design</h3>
                        <p className="text-sm text-gray-600">$2,500 • 2 weeks</p>
                      </div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="mt-3 bg-gray-100 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full w-3/4"></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold">AI Match Score</p>
                        <p className="text-sm opacity-90">95% compatibility</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Now Opens Learn More Modals */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Succeed
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge AI technology with intuitive design to make freelance project management effortless.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <button
                key={index}
                onClick={() => openFeatureModal(feature)}
                className="group bg-white rounded-2xl p-8 border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer text-left w-full"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {feature.description}
                </p>
                
                <div className="flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span>Learn More</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Interactive */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Loved by{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Thousands
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              See what our users have to say about their experience with Project Launchpad.
            </p>
            
            <button
              onClick={() => setShowReviewForm(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Write a Review
            </button>
          </div>

          {/* Testimonial Carousel */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg relative">
              <div className="absolute -top-4 left-8">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Quote className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="flex items-center space-x-1 mb-6 mt-4">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
                {testimonials[currentTestimonial].verified && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Verified
                  </span>
                )}
              </div>

              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                "{testimonials[currentTestimonial].content}"
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img 
                    src={testimonials[currentTestimonial].avatar} 
                    alt={testimonials[currentTestimonial].name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonials[currentTestimonial].name}</h4>
                    <p className="text-sm text-gray-600">{testimonials[currentTestimonial].role}</p>
                    <p className="text-sm text-blue-600">{testimonials[currentTestimonial].company}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={prevTestimonial}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={nextTestimonial}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Testimonial indicators */}
              <div className="flex justify-center space-x-2 mt-6">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">4.9/5</div>
              <p className="text-gray-600">Average Rating</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-indigo-600 mb-2">50K+</div>
              <p className="text-gray-600">Happy Users</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">10K+</div>
              <p className="text-gray-600">Projects Done</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-pink-600 mb-2">98%</div>
              <p className="text-gray-600">Success Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Project Launchpad</span>
              </div>
              <p className="text-gray-400 max-w-md mb-6">
                Empowering freelancers and businesses with AI-driven project matching. 
                Build better teams, deliver outstanding results.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Product</h3>
              <ul className="space-y-3">
                <li><Link to="/auth?feature=features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/auth?feature=pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/auth?feature=integrations" className="text-gray-400 hover:text-white transition-colors">Integrations</Link></li>
                <li><Link to="/auth?feature=api" className="text-gray-400 hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Company</h3>
              <ul className="space-y-3">
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
                <li><Link to="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/careers" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 Project Launchpad. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/cookies" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">How Project Launchpad Works</h2>
              <button
                onClick={() => setShowDemo(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="relative">
                <img
                  src={demoSteps[currentDemoStep].image}
                  alt={demoSteps[currentDemoStep].title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
                
                <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Step {currentDemoStep + 1} of {demoSteps.length}
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {demoSteps[currentDemoStep].title}
              </h3>
              <p className="text-gray-600 mb-6">
                {demoSteps[currentDemoStep].description}
              </p>
              
              <div className="flex items-center justify-between">
                <button
                  onClick={prevDemoStep}
                  disabled={currentDemoStep === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                
                <div className="flex space-x-2">
                  {demoSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentDemoStep(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentDemoStep ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                {currentDemoStep === demoSteps.length - 1 ? (
                  <Link
                    to="/auth"
                    className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    onClick={nextDemoStep}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Detail Modal */}
      {showFeatureModal && selectedFeature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 bg-gradient-to-r ${selectedFeature.color} rounded-xl flex items-center justify-center`}>
                  <selectedFeature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedFeature.title}</h2>
                  <p className="text-gray-600">{selectedFeature.detailedInfo.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setShowFeatureModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Overview */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Overview</h3>
                <p className="text-gray-700 leading-relaxed">{selectedFeature.detailedInfo.overview}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(selectedFeature.detailedInfo.stats).map(([key, value]) => (
                  <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{value as string}</div>
                    <div className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  </div>
                ))}
              </div>

              {/* Benefits */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Benefits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedFeature.detailedInfo.benefits.map((benefit: string, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* How It Works */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h3>
                <div className="space-y-4">
                  {selectedFeature.detailedInfo.howItWorks.map((step: string, index: number) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Experience {selectedFeature.title}?</h4>
                <p className="text-gray-600 mb-4">Join thousands of satisfied users and transform your project management today.</p>
                <Link
                  to="/auth"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Write a Review</h2>
              <button
                onClick={() => setShowReviewForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={userReview.name}
                  onChange={(e) => setUserReview({ ...userReview, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={userReview.email}
                  onChange={(e) => setUserReview({ ...userReview, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserReview({ ...userReview, rating: star })}
                      className={`w-8 h-8 ${star <= userReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      <Star className="w-full h-full fill-current" />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
                <textarea
                  required
                  rows={4}
                  value={userReview.comment}
                  onChange={(e) => setUserReview({ ...userReview, comment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Share your experience..."
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;