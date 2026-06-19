import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Users, Award, Clock, PlayCircle, ChevronRight, Star, 
  TrendingUp, Shield, MessageCircle, Sparkles, Target, Zap, 
  Bot, Brain, GraduationCap, BarChart3, FileText, Puzzle,
  Rocket, Cpu, Workflow, Radio, User
} from 'lucide-react';


function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-700/50 backdrop-blur-sm bg-gray-900/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-emerald-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                LearnEase AI
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-emerald-400 transition">AI Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-emerald-400 transition">How It Works</a>
              <a href="#testimonials" className="text-gray-300 hover:text-emerald-400 transition">Success Stories</a>
              <a href="#pricing" className="text-gray-300 hover:text-emerald-400 transition">Pricing</a>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-300 hover:text-emerald-400 transition">Log in</Link>
              <Link to="/signup" className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2 rounded-full font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all transform hover:scale-105">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - AI Powered */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-purple-500/10 blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-full px-4 py-2">
                <Cpu className="h-5 w-5 text-emerald-400 mr-2" />
                <span className="text-sm text-gray-300">Powered by Advanced AI • 100K+ Learners</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Your Personal AI
                <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Learning Assistant
                </span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                Experience the future of education with LearnEase AI. Get personalized quizzes, smart reviewers, and an intelligent chatbot that adapts to your learning style 24/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="group bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 rounded-full font-medium text-lg hover:shadow-xl hover:shadow-emerald-500/30 transition-all transform hover:scale-105 flex items-center justify-center">
                  Try AI Assistant Now
                  <Bot className="ml-2 h-5 w-5 group-hover:animate-pulse" />
                </button>
                <button className="border border-gray-600 hover:border-emerald-400 px-8 py-4 rounded-full font-medium text-lg transition-all backdrop-blur-sm bg-gray-900/30 flex items-center justify-center">
                  <Radio className="mr-2 h-5 w-5" />
                  See AI in Action
                </button>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center">
                  <Brain className="h-5 w-5 text-emerald-400 mr-2" />
                  <span>AI-Powered</span>
                </div>
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-emerald-400 mr-2" />
                  <span>Smart Reviewers</span>
                </div>
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-emerald-400 mr-2" />
                  <span>Progress AI</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 rounded-full blur-3xl opacity-20"></div>
              <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-400 ml-2">AI Assistant • Online</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex-1 bg-gray-700/50 rounded-lg p-3">
                      <p className="text-sm">I notice you're struggling with React hooks. Would you like me to generate a practice quiz?</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 ml-4">
                    <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-3">
                      <p className="text-sm">Yes please! Focus on useEffect and useState.</p>
                    </div>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-4 border border-emerald-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-emerald-400">AI-Generated Quiz</span>
                      <span className="text-xs bg-emerald-500/20 px-2 py-1 rounded-full">5 questions</span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">1. What's the difference between useEffect and useLayoutEffect?</div>
                      <div className="text-sm">2. When does the cleanup function in useEffect run?</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section id="features" className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Powered by Intelligent
              <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                AI Technology
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Three core AI features designed to revolutionize your learning experience
            </p>
          </div>
          
          {/* Core AI Features Highlight */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {[
              {
                icon: <MessageCircle className="h-10 w-10 text-emerald-400" />,
                title: "AI Chatbot Tutor",
                description: "24/7 intelligent assistance that understands your questions and provides personalized explanations, code examples, and learning resources.",
                features: ["Natural language processing", "Context-aware responses", "Multi-subject support"],
                gradient: "from-emerald-500 to-cyan-500"
              },
              {
                icon: <FileText className="h-10 w-10 text-cyan-400" />,
                title: "Smart Reviewer Generator",
                description: "Transform any topic into comprehensive study materials with AI-generated summaries, key points, and practice questions.",
                features: ["Auto-generated summaries", "Key concept extraction", "Custom difficulty levels"],
                gradient: "from-cyan-500 to-blue-500"
              },
              {
                icon: <Puzzle className="h-10 w-10 text-purple-400" />,
                title: "AI Quiz Creator",
                description: "Generate adaptive quizzes that test your knowledge and identify areas needing improvement with intelligent question selection.",
                features: ["Adaptive difficulty", "Instant feedback", "Performance analytics"],
                gradient: "from-purple-500 to-pink-500"
              }
            ].map((feature, index) => (
              <div key={index} className="group bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                <div className="relative">
                  <div className={`bg-gradient-to-br ${feature.gradient} w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-gray-400 mb-6">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.features.map((item, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-300">
                        <Sparkles className="h-4 w-4 text-emerald-400 mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Additional AI Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <BarChart3 className="h-6 w-6 text-emerald-400" />,
                title: "Progress Tracker AI",
                description: "Visual learning analytics with predictive insights"
              },
              {
                icon: <Target className="h-6 w-6 text-emerald-400" />,
                title: "Personalized Pathways",
                description: "AI-curated learning paths based on your goals"
              },
              {
                icon: <Zap className="h-6 w-6 text-emerald-400" />,
                title: "Instant Feedback",
                description: "Real-time corrections and suggestions"
              },
              {
                icon: <GraduationCap className="h-6 w-6 text-emerald-400" />,
                title: "Smart Recommendations",
                description: "AI suggests next topics to master"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-emerald-400/50 transition-all">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-gray-700/50 p-2 rounded-lg">
                    {feature.icon}
                  </div>
                  <h4 className="font-semibold">{feature.title}</h4>
                </div>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - AI Process */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              How LearnEase AI
              <span className="block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Transforms Your Learning
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Three simple steps to unlock personalized AI-powered education
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-1/2 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-emerald-500/50 to-cyan-500/50 transform -translate-y-1/2"></div>
            
            {[
              {
                step: "01",
                title: "Choose Your Topic",
                description: "Select any subject or upload your materials. Our AI instantly analyzes your learning needs and goals.",
                icon: <Target className="h-8 w-8" />
              },
              {
                step: "02",
                title: "AI Generates Content",
                description: "Watch as our AI creates personalized reviewers, quizzes, and practice exercises tailored to your level.",
                icon: <Cpu className="h-8 w-8" />
              },
              {
                step: "03",
                title: "Learn & Track Progress",
                description: "Interact with your AI tutor, take quizzes, and monitor your improvement with detailed analytics.",
                icon: <Rocket className="h-8 w-8" />
              }
            ].map((item, index) => (
              <div key={index} className="relative text-center group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl group-hover:opacity-100 opacity-0 transition-opacity"></div>
                <div className="relative">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                    {item.icon}
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 mb-2">{item.step}</div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Progress Tracker Showcase */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-full px-4 py-2">
                <BarChart3 className="h-5 w-5 text-emerald-400 mr-2" />
                <span className="text-sm text-gray-300">AI Progress Tracker</span>
              </div>
              <h2 className="text-4xl font-bold">
                Smart Analytics That
                <span className="block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Understand Your Growth
                </span>
              </h2>
              <p className="text-xl text-gray-300">
                Our AI doesn't just track your progress—it predicts challenges, recommends focus areas, and celebrates your achievements.
              </p>
              <div className="space-y-4">
                {[
                  "Real-time performance insights",
                  "Predictive difficulty alerts",
                  "Personalized study reminders",
                  "Streak tracking and milestones"
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <ChevronRight className="h-3 w-3" />
                    </div>
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur-3xl opacity-20"></div>
              <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-semibold">Your Learning Progress</h4>
                  <span className="text-sm text-emerald-400">↑ 23% this week</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Web Development</span>
                      <span className="text-emerald-400">78%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Data Structures</span>
                      <span className="text-emerald-400">45%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full w-2/5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">AI recommends: Review binary trees</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>AI & Machine Learning</span>
                      <span className="text-emerald-400">92%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full w-[92%] bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Current Streak</span>
                      <span className="font-bold text-emerald-400">15 days 🔥</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Updated with AI focus */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Loved by Learners
              <span className="block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Who Found Their Edge with AI
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              See how our AI-powered features are helping students learn smarter, not harder.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Alex Thompson",
                role: "CS Student",
                content: "The AI chatbot saved me hours of searching. It explains complex concepts like a patient tutor, and the generated quizzes helped me ace my finals.",
                avatar: "AT",
                rating: 5,
                feature: "AI Chatbot Tutor"
              },
              {
                name: "Maria Garcia",
                role: "Self-taught Developer",
                content: "Smart reviewer generator is a game-changer. I upload documentation and get concise summaries with practice questions. It's like having a teaching assistant.",
                avatar: "MG",
                rating: 5,
                feature: "Smart Reviewer AI"
              },
              {
                name: "James Wilson",
                role: "Data Science Learner",
                content: "The progress tracker AI predicted I was struggling with Python before I even realized it. The personalized recommendations helped me improve rapidly.",
                avatar: "JW",
                rating: 5,
                feature: "Progress Tracker AI"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-emerald-400/50 transition-all relative">
                <div className="absolute top-6 right-6">
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">
                    {testimonial.feature}
                  </span>
                </div>
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center font-bold text-lg">
                    {testimonial.avatar}
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">"{testimonial.content}"</p>
                <div className="flex items-center">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - Updated for AI features */}
      <section id="pricing" className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Start Learning with AI
              <span className="block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Free Trial Available
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              No credit card required. Experience the full power of AI learning for 14 days.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$0",
                period: "forever",
                features: [
                  "Basic AI chatbot access", 
                  "5 AI-generated quizzes/month", 
                  "3 reviewer summaries/month",
                  "Basic progress tracking",
                  "Community support"
                ],
                popular: false,
                buttonText: "Start Free"
              },
              {
                name: "Pro",
                price: "$29",
                period: "month",
                features: [
                  "Unlimited AI chatbot sessions",
                  "Unlimited AI-generated quizzes",
                  "Unlimited reviewer summaries",
                  "Advanced progress analytics",
                  "Priority AI response time",
                  "Personalized learning paths",
                  "Export study materials"
                ],
                popular: true,
                buttonText: "Try 14 Days Free"
              },
              {
                name: "Teams",
                price: "$99",
                period: "month",
                features: [
                  "Everything in Pro",
                  "Team analytics dashboard",
                  "Shared AI workspace",
                  "Custom AI model training",
                  "API access",
                  "Dedicated account manager",
                  "SLA guarantee"
                ],
                popular: false,
                buttonText: "Contact Sales"
              }
            ].map((plan, index) => (
              <div key={index} className={`relative bg-gray-800/30 backdrop-blur-sm border rounded-2xl p-8 ${
                plan.popular 
                  ? 'border-emerald-400 shadow-lg shadow-emerald-500/20' 
                  : 'border-gray-700 hover:border-emerald-400/50'
              } transition-all`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-400">/{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-gray-300">
                      <Sparkles className="h-4 w-4 text-emerald-400 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-full font-medium transition-all transform hover:scale-105 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-lg hover:shadow-emerald-500/30'
                    : 'border border-gray-600 hover:border-emerald-400 hover:bg-gray-700/30'
                }`}>
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - AI Focused */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-purple-500/20 blur-3xl"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-full px-4 py-2 mb-6">
            <Bot className="h-5 w-5 text-emerald-400 mr-2" />
            <span className="text-sm text-gray-300">Your AI learning companion is waiting</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Learn Smarter
            <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              With Artificial Intelligence?
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Join 100,000+ learners who are already accelerating their growth with LearnEase AI.
          </p>
          <button className="group bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 px-10 py-5 rounded-full font-medium text-lg hover:shadow-2xl hover:shadow-emerald-500/30 transition-all transform hover:scale-110 inline-flex items-center">
            Chat with AI Assistant
            <Bot className="ml-2 h-5 w-5 group-hover:animate-pulse" />
          </button>
          <p className="mt-6 text-sm text-gray-400">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer - Updated */}
      <footer className="border-t border-gray-700/50 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-emerald-400" />
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  LearnEase AI
                </span>
              </div>
              <p className="text-gray-400">
                Revolutionizing education through artificial intelligence. Learn smarter, achieve faster.
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Cpu className="h-4 w-4" />
                <span>Powered by Advanced AI</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">AI Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-emerald-400 transition">AI Chatbot</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Quiz Generator</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Smart Reviewers</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Progress Tracker AI</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-emerald-400 transition">AI Learning Blog</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Documentation</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">API Reference</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Status Page</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-emerald-400 transition">Twitter</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">LinkedIn</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Discord</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">GitHub</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700/50 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LearnEase AI. All rights reserved. Powered by artificial intelligence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;