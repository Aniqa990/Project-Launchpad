import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './button';
import { Avatar } from './avatar';
import { Badge } from './badge';
import { Star, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
    freelancer: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
  onSubmitReview: (review: {
    rating: number;
    comment: string;
    tags: string[];
  }) => void;
}

export function ReviewModal({ isOpen, onClose, project, onSubmitReview }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const feedbackTags = [
    'Excellent Quality',
    'On Time Delivery',
    'Great Communication',
    'Professional',
    'Creative Solutions',
    'Responsive',
    'Attention to Detail',
    'Goes Above & Beyond',
    'Technical Expertise',
    'Easy to Work With'
  ];

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating: number) => {
    setHoverRating(starRating);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    onSubmitReview({
      rating,
      comment,
      tags: selectedTags
    });

    setSubmitted(true);
    toast.success('Review submitted successfully!');
    
    // Auto-close after 2 seconds
    setTimeout(() => {
      onClose();
      // Reset form
      setRating(0);
      setComment('');
      setSelectedTags([]);
      setSubmitted(false);
    }, 2000);
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  if (submitted) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Review Submitted" size="md">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank you for your feedback!</h3>
          <p className="text-gray-600">
            Your review helps other clients find great freelancers and helps {project.freelancer.name} improve their services.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Leave a Review" size="lg">
      <div className="space-y-6">
        {/* Project & Freelancer Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">{project.title}</h3>
          <div className="flex items-center space-x-3">
            <Avatar src={project.freelancer.avatar} alt={project.freelancer.name} size="sm" />
            <div>
              <p className="font-medium text-gray-900">{project.freelancer.name}</p>
              <p className="text-sm text-gray-600">Freelancer</p>
            </div>
          </div>
        </div>

        {/* Star Rating */}
        <div className="text-center">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">How would you rate this freelancer?</h4>
          <div className="flex justify-center space-x-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => handleStarHover(star)}
                onMouseLeave={handleStarLeave}
                className="transition-all duration-200 transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 transition-colors duration-200 ${
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {(rating > 0 || hoverRating > 0) && (
            <p className="text-lg font-medium text-gray-700 transition-all duration-200">
              {getRatingText(hoverRating || rating)}
            </p>
          )}
        </div>

        {/* Feedback Tags */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">What did you like most?</h4>
          <div className="flex flex-wrap gap-2">
            {feedbackTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Additional Comments (Optional)</h4>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Share more details about your experience working with this freelancer..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={rating === 0}
            icon={Send}
          >
            Submit Review
          </Button>
        </div>
      </div>
    </Modal>
  );
}