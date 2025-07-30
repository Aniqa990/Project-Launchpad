import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFreelancerFeedbacks } from '../../apiendpoints';
import { Star, Calendar, User, MessageSquare, Filter, Search, TrendingUp } from 'lucide-react';
import { Feedback as FeedbackType } from '@/types';
import { handleError } from '@/utils/errorHandler';

export function Feedback() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      if (!user?.id) return;
      try {
        const feedbacks = await getFreelancerFeedbacks(user.id);
        console.log('Feedback API response:', feedbacks);
        setFeedback(feedbacks);
      } catch (error) {
        handleError(error, 'fetchFeedbacks');
        setFeedback([]);
      }
    };
    fetchFeedbacks();
  }, [user?.id]);

  const filteredFeedback = feedback.filter((item: FeedbackType) => {
    const matchesSearch = (item.projectName && item.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.clientName && item.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.review && item.review.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRating = filterRating === null || item.rating === filterRating;
    return matchesSearch && matchesRating;
  });

  const averageRating = feedback.length > 0 ?
    (feedback.reduce((sum: number, item: FeedbackType) => sum + item.rating, 0) / feedback.length).toFixed(1) : '0.0';

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: feedback.filter((item: FeedbackType) => Math.round(item.rating) === rating).length,
    percentage: feedback.length > 0 ? (feedback.filter((item: FeedbackType) => Math.round(item.rating) === rating).length / feedback.length) * 100 : 0
  }));

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feedback</h1>
          <p className="text-gray-600 mt-1">View client reviews and ratings for your work</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterRating || ''}
            onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Average Rating</p>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-3xl font-bold">{averageRating}</p>
                <div className="flex items-center space-x-1">
                  {renderStars(Math.round(Number(averageRating)), 'sm')}
                </div>
              </div>
            </div>
            <div className="bg-yellow-400 p-3 rounded-xl">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Reviews</p>
              <p className="text-3xl font-bold">{feedback.length}</p>
            </div>
            <div className="bg-blue-400 p-3 rounded-xl">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">5-Star Reviews</p>
              <p className="text-3xl font-bold">
                {feedback.filter((item: FeedbackType) => item.rating === 5).length}
              </p>
            </div>
            <div className="bg-green-400 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
      {/* Rating Distribution */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Rating Distribution</h3>
        <div className="space-y-3">
          {ratingDistribution.map((item) => (
            <div key={item.rating} className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 w-16">
                <span className="text-sm font-medium">{item.rating}</span>
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
              </div>
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
              <span className="text-sm text-gray-600 w-12">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedback.map((item, idx) => (
          <div
            key={`${item.projectId}-${item.createdAt}-${idx}`}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.clientName}</h3>
                  <p className="text-gray-600 text-sm">{item.projectName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {renderStars(item.rating)}
                <span className="text-sm font-medium text-gray-700">({item.rating}.0)</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700 leading-relaxed">{item.review}</p>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageSquare className="w-4 h-4" />
                <span>Project Review</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filteredFeedback.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Feedback Found</h3>
          <p className="text-gray-600">
            {searchTerm || filterRating ?
              'Try adjusting your search or filter criteria.' :
              'Client feedback will appear here after project completion.'
            }
          </p>
        </div>
      )}
    </div>
  );
}