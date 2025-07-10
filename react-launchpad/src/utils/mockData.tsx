import { Project, Task, User, Milestone, TimeEntry, Message } from '../types';

export const mockClients: User[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@client.com',
    role: 'client',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '5',
    name: 'Michael Chen',
    email: 'michael@techcorp.com',
    role: 'client',
    avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '6',
    name: 'Emily Rodriguez',
    email: 'emily@startup.io',
    role: 'client',
    avatar: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=400'
  }
];

export const mockFreelancers: User[] = [
  {
    id: '2',
    name: 'Alex Chen',
    email: 'alex@freelancer.com',
    role: 'freelancer',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS'],
    hourlyRate: 85,
    rating: 4.8,
    reviews: 127,
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '3',
    name: 'Maria Garcia',
    email: 'maria@freelancer.com',
    role: 'freelancer',
    skills: ['UI/UX', 'Figma', 'Adobe XD', 'Prototyping', 'User Research'],
    hourlyRate: 75,
    rating: 4.9,
    reviews: 89,
    avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '4',
    name: 'David Kumar',
    email: 'david@freelancer.com',
    role: 'freelancer',
    skills: ['Python', 'Django', 'PostgreSQL', 'Docker', 'Machine Learning'],
    hourlyRate: 90,
    rating: 4.7,
    reviews: 156,
    avatar: 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '7',
    name: 'Sophie Williams',
    email: 'sophie@freelancer.com',
    role: 'freelancer',
    skills: ['Flutter', 'Dart', 'iOS', 'Android', 'Firebase'],
    hourlyRate: 80,
    rating: 4.6,
    reviews: 94,
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '8',
    name: 'James Wilson',
    email: 'james@freelancer.com',
    role: 'freelancer',
    skills: ['DevOps', 'Kubernetes', 'CI/CD', 'Terraform', 'Monitoring'],
    hourlyRate: 95,
    rating: 4.9,
    reviews: 203,
    avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400'
  }
];

export const mockProjects: Project[] = [
  {
    id: '1',
    title: 'E-commerce Platform Redesign',
    description: 'Complete redesign of our e-commerce platform with modern UI/UX, improved performance, and mobile-first approach. The project includes user research, wireframing, visual design, and frontend development.',
    status: 'active',
    budget: 15000,
    deadline: '2024-03-15',
    clientId: '1',
    client: mockClients[0],
    skills: ['React', 'UI/UX', 'Node.js'],
    team: [mockFreelancers[0], mockFreelancers[1]],
    progress: 65,
    createdAt: '2024-01-15',
    milestones: [
      {
        id: '1',
        title: 'Design System & Wireframes',
        description: 'Create comprehensive design system and wireframes for all pages',
        amount: 5000,
        dueDate: '2024-02-01',
        status: 'paid',
        deliverables: ['Design tokens', 'Component library', 'Wireframes']
      },
      {
        id: '2',
        title: 'Frontend Development',
        description: 'Implement responsive frontend with React components',
        amount: 7500,
        dueDate: '2024-02-28',
        status: 'approved',
        deliverables: ['React components', 'Responsive layouts', 'API integration']
      },
      {
        id: '3',
        title: 'Testing & Deployment',
        description: 'Quality assurance testing and production deployment',
        amount: 2500,
        dueDate: '2024-03-15',
        status: 'pending',
        deliverables: ['Test suite', 'Production deployment', 'Documentation']
      }
    ]
  },
  {
    id: '2',
    title: 'Mobile Food Delivery App',
    description: 'Native mobile application for food delivery service with real-time tracking, payment integration, and restaurant management features.',
    status: 'active',
    budget: 25000,
    deadline: '2024-04-30',
    clientId: '5',
    client: mockClients[1],
    skills: ['Flutter', 'Firebase', 'UI/UX'],
    team: [mockFreelancers[3], mockFreelancers[1]],
    progress: 35,
    createdAt: '2024-01-22',
    milestones: [
      {
        id: '4',
        title: 'App Design & Prototyping',
        description: 'Complete app design with interactive prototypes',
        amount: 8000,
        dueDate: '2024-02-15',
        status: 'approved',
        deliverables: ['UI designs', 'Interactive prototype', 'Design system']
      },
      {
        id: '5',
        title: 'Core App Development',
        description: 'Develop core features including user auth, restaurant listings, and ordering',
        amount: 12000,
        dueDate: '2024-03-30',
        status: 'pending',
        deliverables: ['Flutter app', 'Backend API', 'Database setup']
      },
      {
        id: '6',
        title: 'Advanced Features & Launch',
        description: 'Real-time tracking, payments, and app store deployment',
        amount: 5000,
        dueDate: '2024-04-30',
        status: 'pending',
        deliverables: ['Real-time tracking', 'Payment integration', 'App store release']
      }
    ]
  },
  {
    id: '3',
    title: 'AI-Powered Analytics Dashboard',
    description: 'Business intelligence dashboard with machine learning insights, data visualization, and automated reporting capabilities.',
    status: 'completed',
    budget: 18000,
    deadline: '2024-01-30',
    clientId: '6',
    client: mockClients[2],
    skills: ['Python', 'Machine Learning', 'React', 'Data Visualization'],
    team: [mockFreelancers[2], mockFreelancers[0]],
    progress: 100,
    createdAt: '2023-11-15',
    milestones: [
      {
        id: '7',
        title: 'Data Pipeline & ML Models',
        description: 'Build data processing pipeline and train ML models',
        amount: 8000,
        dueDate: '2023-12-15',
        status: 'paid',
        deliverables: ['Data pipeline', 'ML models', 'API endpoints']
      },
      {
        id: '8',
        title: 'Dashboard Frontend',
        description: 'Create interactive dashboard with data visualizations',
        amount: 7000,
        dueDate: '2024-01-15',
        status: 'paid',
        deliverables: ['React dashboard', 'Charts & graphs', 'User interface']
      },
      {
        id: '9',
        title: 'Deployment & Documentation',
        description: 'Deploy to production and create comprehensive documentation',
        amount: 3000,
        dueDate: '2024-01-30',
        status: 'paid',
        deliverables: ['Production deployment', 'User documentation', 'Admin guide']
      }
    ]
  },
  {
    id: '4',
    title: 'DevOps Infrastructure Setup',
    description: 'Complete DevOps infrastructure setup with CI/CD pipelines, monitoring, and automated deployments for a growing startup.',
    status: 'active',
    budget: 12000,
    deadline: '2024-03-01',
    clientId: '1',
    client: mockClients[0],
    skills: ['DevOps', 'Kubernetes', 'CI/CD', 'Monitoring'],
    team: [mockFreelancers[4]],
    progress: 45,
    createdAt: '2024-01-10',
    milestones: [
      {
        id: '10',
        title: 'Infrastructure Setup',
        description: 'Set up cloud infrastructure and container orchestration',
        amount: 6000,
        dueDate: '2024-02-01',
        status: 'approved',
        deliverables: ['Kubernetes cluster', 'Infrastructure as code', 'Security setup']
      },
      {
        id: '11',
        title: 'CI/CD & Monitoring',
        description: 'Implement automated pipelines and monitoring solutions',
        amount: 6000,
        dueDate: '2024-03-01',
        status: 'pending',
        deliverables: ['CI/CD pipelines', 'Monitoring dashboard', 'Alerting system']
      }
    ]
  }
];

export const mockTasks: Task[] = [
  // E-commerce Platform tasks
  {
    id: '1',
    title: 'Design Homepage Layout',
    description: 'Create wireframes and mockups for the homepage with modern design principles',
    status: 'done',
    assigneeId: '3',
    assignee: mockFreelancers[1],
    projectId: '1',
    priority: 'high',
    estimatedHours: 8,
    actualHours: 7,
    createdAt: '2024-01-16',
    dueDate: '2024-01-20'
  },
  {
    id: '2',
    title: 'Implement Product Cards',
    description: 'Build reusable product card components with hover effects and responsive design',
    status: 'inprogress',
    assigneeId: '2',
    assignee: mockFreelancers[0],
    projectId: '1',
    priority: 'medium',
    estimatedHours: 12,
    actualHours: 8,
    createdAt: '2024-01-18',
    dueDate: '2024-01-25'
  },
  {
    id: '3',
    title: 'Setup Authentication System',
    description: 'Implement secure user authentication with JWT tokens and password reset functionality',
    status: 'todo',
    assigneeId: '2',
    assignee: mockFreelancers[0],
    projectId: '1',
    priority: 'high',
    estimatedHours: 16,
    actualHours: 0,
    createdAt: '2024-01-20',
    dueDate: '2024-02-05'
  },
  {
    id: '4',
    title: 'Shopping Cart Implementation',
    description: 'Build shopping cart functionality with local storage and checkout flow',
    status: 'todo',
    assigneeId: '2',
    assignee: mockFreelancers[0],
    projectId: '1',
    priority: 'medium',
    estimatedHours: 20,
    actualHours: 0,
    createdAt: '2024-01-22',
    dueDate: '2024-02-10'
  },
  {
    id: '5',
    title: 'Payment Gateway Integration',
    description: 'Integrate Stripe payment gateway with error handling and receipt generation',
    status: 'todo',
    assigneeId: '2',
    assignee: mockFreelancers[0],
    projectId: '1',
    priority: 'high',
    estimatedHours: 14,
    actualHours: 0,
    createdAt: '2024-01-25',
    dueDate: '2024-02-15'
  },
  // Mobile App tasks
  {
    id: '6',
    title: 'User Onboarding Flow',
    description: 'Design and implement user registration and onboarding screens',
    status: 'done',
    assigneeId: '7',
    assignee: mockFreelancers[3],
    projectId: '2',
    priority: 'high',
    estimatedHours: 16,
    actualHours: 15,
    createdAt: '2024-01-23',
    dueDate: '2024-02-01'
  },
  {
    id: '7',
    title: 'Restaurant Listing Screen',
    description: 'Create restaurant listing with filters, search, and map integration',
    status: 'inprogress',
    assigneeId: '7',
    assignee: mockFreelancers[3],
    projectId: '2',
    priority: 'medium',
    estimatedHours: 24,
    actualHours: 12,
    createdAt: '2024-01-25',
    dueDate: '2024-02-10'
  },
  {
    id: '8',
    title: 'Order Tracking System',
    description: 'Implement real-time order tracking with push notifications',
    status: 'todo',
    assigneeId: '7',
    assignee: mockFreelancers[3],
    projectId: '2',
    priority: 'high',
    estimatedHours: 32,
    actualHours: 0,
    createdAt: '2024-01-28',
    dueDate: '2024-03-15'
  },
  // DevOps tasks
  {
    id: '9',
    title: 'Kubernetes Cluster Setup',
    description: 'Set up production-ready Kubernetes cluster with auto-scaling',
    status: 'done',
    assigneeId: '8',
    assignee: mockFreelancers[4],
    projectId: '4',
    priority: 'high',
    estimatedHours: 20,
    actualHours: 18,
    createdAt: '2024-01-11',
    dueDate: '2024-01-20'
  },
  {
    id: '10',
    title: 'CI/CD Pipeline Configuration',
    description: 'Configure automated deployment pipelines with testing and rollback capabilities',
    status: 'inprogress',
    assigneeId: '8',
    assignee: mockFreelancers[4],
    projectId: '4',
    priority: 'high',
    estimatedHours: 24,
    actualHours: 16,
    createdAt: '2024-01-15',
    dueDate: '2024-02-01'
  }
];

export const mockSubtasks = [
  { Id: 1, Title: 'Wireframe Header', Description: 'Design the header section', DueDate: '2024-01-18', Status: 0, TaskItemId: 1 },
  { Id: 2, Title: 'Wireframe Footer', Description: 'Design the footer section', DueDate: '2024-01-19', Status: 0, TaskItemId: 1 },
  { Id: 3, Title: 'Product Card UI', Description: 'UI for product cards', DueDate: '2024-01-20', Status: 1, TaskItemId: 2 },
  { Id: 4, Title: 'Product Card Logic', Description: 'JS logic for product cards', DueDate: '2024-01-21', Status: 1, TaskItemId: 2 },
  { Id: 5, Title: 'Auth UI', Description: 'UI for authentication', DueDate: '2024-01-22', Status: 0, TaskItemId: 3 },
  { Id: 6, Title: 'Auth API', Description: 'API for authentication', DueDate: '2024-01-23', Status: 0, TaskItemId: 3 },
];


export const mockTimeEntries: TimeEntry[] = [
  {
    id: '1',
    userId: '2',
    projectId: '1',
    taskId: '2',
    date: '2024-01-24',
    startTime: '09:00',
    endTime: '12:00',
    hours: 3,
    description: 'Working on product card components and responsive design',
    status: 'approved'
  },
  {
    id: '2',
    userId: '2',
    projectId: '1',
    taskId: '2',
    date: '2024-01-24',
    startTime: '13:00',
    endTime: '17:00',
    hours: 4,
    description: 'Implementing hover effects and animations for product cards',
    status: 'approved'
  },
  {
    id: '3',
    userId: '3',
    projectId: '1',
    taskId: '1',
    date: '2024-01-19',
    startTime: '10:00',
    endTime: '17:00',
    hours: 7,
    description: 'Created homepage wireframes and design mockups',
    status: 'approved'
  },
  {
    id: '4',
    userId: '7',
    projectId: '2',
    taskId: '7',
    date: '2024-01-25',
    startTime: '09:30',
    endTime: '13:30',
    hours: 4,
    description: 'Working on restaurant listing screen with search functionality',
    status: 'submitted'
  },
  {
    id: '5',
    userId: '8',
    projectId: '4',
    taskId: '10',
    date: '2024-01-24',
    startTime: '08:00',
    endTime: '16:00',
    hours: 8,
    description: 'Configuring CI/CD pipeline with automated testing',
    status: 'submitted'
  }
];

export const mockMessages: Message[] = [
  {
    id: '1',
    senderId: '1',
    sender: mockClients[0],
    content: 'Hi team! Great progress on the homepage design. The wireframes look fantastic.',
    timestamp: '2024-01-24T10:30:00Z',
    projectId: '1'
  },
  {
    id: '2',
    senderId: '3',
    sender: mockFreelancers[1],
    content: 'Thank you! I\'ve incorporated the feedback from our last meeting. The mobile version is now ready for review.',
    timestamp: '2024-01-24T10:45:00Z',
    projectId: '1'
  },
  {
    id: '3',
    senderId: '2',
    sender: mockFreelancers[0],
    content: 'The product card components are almost complete. I\'ll have them ready for testing by tomorrow.',
    timestamp: '2024-01-24T14:20:00Z',
    projectId: '1'
  },
  {
    id: '4',
    senderId: '5',
    sender: mockClients[1],
    content: 'The app prototype looks amazing! Can we schedule a call to discuss the payment integration?',
    timestamp: '2024-01-25T09:15:00Z',
    projectId: '2'
  },
  {
    id: '5',
    senderId: '7',
    sender: mockFreelancers[3],
    content: 'Absolutely! I\'m available tomorrow afternoon. I\'ll send you a calendar invite.',
    timestamp: '2024-01-25T09:30:00Z',
    projectId: '2'
  }
];