import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { 
  Rocket, 
  Users, 
  Clock, 
  Shield, 
  Zap, 
  Target,
  ArrowRight,
  Check,
  Star
} from 'lucide-react';

export function Home() {
  const [activeTab, setActiveTab] = useState<'client' | 'freelancer'>('client');

  const features = [
    {
      icon: Rocket,
      title: 'Project Management',
      description: 'Complete project lifecycle management with Kanban boards, Gantt charts, and milestone tracking.'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Real-time chat, file sharing, and seamless communication between clients and freelancers.'
    },
    {
      icon: Clock,
      title: 'Time Tracking',
      description: 'Automatic time logging with detailed timesheets and productivity insights.'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Escrow-based payments with milestone releases and transparent fee structure.'
    },
    {
      icon: Zap,
      title: 'AI-Powered Matching',
      description: 'Smart freelancer recommendations based on project requirements and past performance.'
    },
    {
      icon: Target,
      title: 'Quality Assurance',
      description: 'Built-in review system and quality checkpoints to ensure project success.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Tech Startup CEO',
      content: 'Project Launchpad transformed how we work with freelancers. The platform makes project management effortless.',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Alex Chen',
      role: 'Full Stack Developer', 
      content: 'As a freelancer, this platform gives me everything I need to deliver quality work and get paid fairly.',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Rocket className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Project Launchpad</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
                Login
              </Link>
              <Link to="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Launch Your Projects with
            <span className="text-blue-600"> Confidence</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The complete freelance project management platform that connects clients with top talent 
            and provides all the tools needed for successful project delivery.
          </p>
          
          {/* Tab Selector */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setActiveTab('client')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'client' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                For Clients
              </button>
              <button
                onClick={() => setActiveTab('freelancer')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'freelancer' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                For Freelancers
              </button>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Link to="/signup">
              <Button size="lg" icon={ArrowRight} iconPosition="right">
                {activeTab === 'client' ? 'Post Your Project' : 'Find Great Projects'}
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to streamline your workflow and deliver exceptional results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} hover className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">Simple steps to get started</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create Your Profile', desc: 'Sign up and tell us about your project needs or skills' },
              { step: '2', title: 'Get Matched', desc: 'Our AI connects clients with the perfect freelancers' },
              { step: '3', title: 'Work Together', desc: 'Use our workspace tools to collaborate and deliver results' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-xl text-gray-600">See what our users say about us</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center justify-center space-x-3">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Launch Your Next Project?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of successful clients and freelancers who trust Project Launchpad 
            to deliver exceptional results.
          </p>
          <Link to="/signup">
            <Button variant="secondary" size="lg" icon={ArrowRight} iconPosition="right">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Rocket className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold">Project Launchpad</span>
            </div>
            <p className="text-gray-400">© 2024 Project Launchpad. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}