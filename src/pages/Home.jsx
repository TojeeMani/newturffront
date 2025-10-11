import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EnhancedImage, ImageCarousel, CardSkeleton, SearchLoader, ChatWidget } from '../components/ui';
import { getDashboardRoute } from '../utils/dashboardRoutes';
import turfService from '../services/turfService';
import {
  ChevronDownIcon,
  MapPinIcon,
  PlayIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CubeIcon,
  UserPlusIcon,
  TrophyIcon,
  UsersIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid,
  FireIcon as FireIconSolid
} from '@heroicons/react/24/solid';

import {
  upcomingTournaments,
  aiFeatures,
  howItWorksSteps,
  testimonials,
  stats
} from '../data/dummyData';
import matchService from '../services/matchService';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [featuredTurfs, setFeaturedTurfs] = useState([]);
  const [loadingTurfs, setLoadingTurfs] = useState(true);
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [myLiveMatches, setMyLiveMatches] = useState([]);
  const [myUpcomingMatches, setMyUpcomingMatches] = useState([]);
  const [myCompletedMatches, setMyCompletedMatches] = useState([]);

  // Redirect admins and owners to their dashboards
  useEffect(() => {
    if (isAuthenticated && user && (user.userType === 'admin' || user.userType === 'owner')) {
      const dashboardRoute = getDashboardRoute(user.userType);
      navigate(dashboardRoute, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch featured turfs
  useEffect(() => {
    const fetchFeaturedTurfs = async () => {
      try {
        setLoadingTurfs(true);
        const response = await turfService.getAllTurfs({
          limit: 6,
          sort: '-rating,-createdAt'
        });
        setFeaturedTurfs(response.data || []);
      } catch (error) {
        console.error('Failed to fetch featured turfs:', error);
        setFeaturedTurfs([]);
      } finally {
        setLoadingTurfs(false);
      }
    };

    fetchFeaturedTurfs();
  }, []);

  // Fetch live and upcoming matches
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoadingMatches(true);
        const basePromises = [
          matchService.getMatches({ window: 'live', isPublic: true, limit: 6 }),
          matchService.getMatches({ window: 'upcoming', isPublic: true, day: 'today', limit: 6 }),
          matchService.getMatches({ window: 'completed', isPublic: true, day: 'today', limit: 20 })
        ];
        const userPromises = (isAuthenticated && user) ? [
          matchService.getMatches({ window: 'live', customerId: user._id || user.id }),
          matchService.getMatches({ window: 'upcoming', day: 'today', customerId: (user._id || user.id) }),
          matchService.getMatches({ window: 'completed', day: 'today', customerId: (user._id || user.id), limit: 20 })
        ] : [];

        const results = await Promise.all([...basePromises, ...userPromises]);
        const [liveRes, upcomingRes, completedRes, myLiveRes, myUpcomingRes, myCompletedRes] = [
          results[0], results[1], results[2], results[3], results[4], results[5]
        ];
        const liveData = liveRes?.data || liveRes || [];
        const upcomingData = upcomingRes?.data || upcomingRes || [];
        setLiveMatches(Array.isArray(liveData) ? liveData : []);
        setUpcomingMatches(Array.isArray(upcomingData) ? upcomingData : []);
        const completedData = completedRes?.data || completedRes || [];
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const completedArray = Array.isArray(completedData) ? completedData : [];
        let completedFiltered = completedArray.filter(m => {
          const when = new Date(m.endTime || m.startTime);
          return when >= startOfDay && when <= endOfDay;
        });
        // Fallback to last 24 hours if none detected for local day (timezone-safe)
        if (completedFiltered.length === 0) {
          const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
          completedFiltered = completedArray.filter(m => new Date(m.endTime || m.startTime) >= last24h);
        }
        const completedSorted = completedFiltered
          .sort((a,b) => new Date(b.endTime || b.startTime) - new Date(a.endTime || a.startTime))
          .slice(0,6);
        setCompletedMatches(completedSorted);
        if (myLiveRes) {
          const mineLive = myLiveRes?.data || myLiveRes || [];
          setMyLiveMatches(Array.isArray(mineLive) ? mineLive : []);
        } else setMyLiveMatches([]);
        if (myUpcomingRes) {
          const mineUpcoming = myUpcomingRes?.data || myUpcomingRes || [];
          setMyUpcomingMatches(Array.isArray(mineUpcoming) ? mineUpcoming : []);
        } else setMyUpcomingMatches([]);
        if (myCompletedRes) {
          const mineCompleted = myCompletedRes?.data || myCompletedRes || [];
          // Show most recent 6 completed; optionally filter to last 7 days
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const recent = (Array.isArray(mineCompleted) ? mineCompleted : []).filter(m => new Date(m.endTime || m.startTime) >= sevenDaysAgo)
            .sort((a,b) => new Date(b.endTime || b.startTime) - new Date(a.endTime || a.startTime)).slice(0,6);
          setMyCompletedMatches(recent);
        } else setMyCompletedMatches([]);
      } catch (e) {
        setLiveMatches([]);
        setUpcomingMatches([]);
        setMyLiveMatches([]);
        setMyUpcomingMatches([]);
        setMyCompletedMatches([]);
        setCompletedMatches([]);
      } finally {
        setLoadingMatches(false);
      }
    };
    fetchMatches();
    const id = setInterval(fetchMatches, 30000);
    return () => clearInterval(id);
  }, [isAuthenticated, user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">

      {/* Hero Section */}
      <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <EnhancedImage
            src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Football Turf Field"
            className="w-full h-full object-cover"
            sport="hero"
            lazy={false}
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Book Your Turf.
            <br />
            <span className="gradient-text">Join Matches.</span>
            <br />
            Host Tournaments.
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl mb-8 text-gray-200"
          >
            AI-powered turf booking & management made easy.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {isAuthenticated && user ? (
              <>
                <Link 
                  to={getDashboardRoute(user.userType)} 
                  className="btn-primary text-lg px-8 py-4"
                >
                  Go to Dashboard
                </Link>
              </>
            ) : (
              <>
                <button className="btn-primary text-lg px-8 py-4">
                  Book Now
                </button>
                <Link to="/register" className="btn-secondary text-lg px-8 py-4 bg-white/10 border-white text-white hover:bg-white/20">
                  Register as Turf Owner
                </Link>
              </>
            )}
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer"
          onClick={() => scrollToSection('turfs')}
        >
          <div className="flex flex-col items-center text-white">
            <span className="text-sm mb-2">Scroll to explore</span>
            <ChevronDownIcon className="w-6 h-6 animate-bounce" />
          </div>
        </motion.div>
      </section>


      
      {/* Stats Section */}
      <section className="py-16 bg-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Turfs Section */}
      <section id="turfs" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Featured Turfs
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover premium sports facilities near you with world-class amenities
            </p>
          </motion.div>

          {loadingTurfs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {[...Array(6)].map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          ) : featuredTurfs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredTurfs.slice(0, 6).map((turf, index) => (
                <motion.div
                  key={turf._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden card-hover cursor-pointer"
                  onClick={() => navigate(`/turfs/${turf._id}`)}
                >
                  <div className="relative">
                    <ImageCarousel
                      images={Array.isArray(turf.images) ? turf.images : (turf.images ? [turf.images] : [])}
                      alt={turf.name}
                      className="w-full h-56 md:h-64 lg:h-72"
                      imageClassName="w-full h-56 md:h-64 lg:h-72 object-cover"
                      sport={turf.sport?.toLowerCase()}
                      autoPlay={true}
                      interval={3500}
                      showArrows={false}
                      showIndicators={true}
                      rounded={false}
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2">
                      <HeartIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="absolute bottom-4 left-4 bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {turf.sport}
                    </div>
                    {turf.isFeatured && (
                      <div className="absolute top-4 left-4 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                        <FireIconSolid className="w-3 h-3 mr-1" />
                        Featured
                      </div>
                    )}
                  </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{turf.name}</h3>
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    <span className="text-sm">{turf.location?.address || 'Location not specified'}</span>
                  </div>

                  {turf.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {turf.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIconSolid
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(turf.rating || 0)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {turf.rating || 'New'}
                        {turf.totalReviews > 0 && ` (${turf.totalReviews})`}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-primary-600">
                      ₹{turf.pricePerHour}/hr
                    </div>
                  </div>

                  {turf.amenities && turf.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {turf.amenities.slice(0, 3).map((amenity, i) => (
                        <span
                          key={i}
                          className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs"
                        >
                          {amenity}
                        </span>
                      ))}
                      {turf.amenities.length > 3 && (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                          +{turf.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <button className="w-full btn-primary">
                    Book Now
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <MapPinIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No Turfs Available</h3>
                <p className="text-gray-600">
                  We're working on adding more turfs to your area. Check back soon!
                </p>
              </div>
            </div>
          )}

          {featuredTurfs.length > 0 && (
            <div className="text-center">
              <button className="btn-secondary">
                View All Turfs
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Live Matches Section */}
      <section id="matches" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center mb-4">
              <FireIconSolid className="w-8 h-8 text-red-500 mr-2" />
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Live Matches
              </h2>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Watch exciting matches happening right now across the platform
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {loadingMatches ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow p-6 flex items-center justify-center text-gray-500">
                  Loading live matches...
                </div>
              ))
            ) : (() => {
              const merged = [...(liveMatches || [])];
              (myLiveMatches || []).forEach(m => {
                if (!merged.find(x => x._id === m._id)) merged.push(m);
              });
              return merged.length === 0 ? (
              <div className="col-span-full text-center text-gray-600">No live matches right now.</div>
            ) : merged.map((match, index) => (
              <motion.div
                key={match._id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 card-hover"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-red-500 font-semibold text-sm">LIVE</span>
                  </div>
                  <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-600">
                    {match.matchType}
                  </div>
                </div>
                
                <div className="text-center mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center">
                      <div className="font-bold text-gray-900 mb-1">{match.teams?.[0]?.name}</div>
                      <div className="text-3xl font-bold text-primary-600">{match.teams?.[0]?.score ?? 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 text-sm mb-1">VS</div>
                      <div className="text-lg font-semibold text-gray-600">{new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900 mb-1">{match.teams?.[1]?.name}</div>
                      <div className="text-3xl font-bold text-primary-600">{match.teams?.[1]?.score ?? 0}</div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center text-sm text-gray-600 mb-4">
                  <MapPinIcon className="w-4 h-4 inline mr-1" />
                  {match.turfId?.name}
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/match/${match.shareCode}`)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    <EyeIcon className="w-4 h-4 inline mr-1" />
                    Watch Live
                  </button>
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <ShareIcon className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </motion.div>
            ));
            })()}
          </div>

          <div className="text-center">
            <button className="btn-secondary">
              View All Live Matches
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </section>

      <section id="upcoming-matches" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Upcoming Matches
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Matches starting soon. Join or watch as they go live.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {loadingMatches ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow p-6 flex items-center justify-center text-gray-500">
                  Loading upcoming matches...
                </div>
              ))
            ) : (upcomingMatches || []).length === 0 ? (
              <div className="col-span-full text-center text-gray-600">No matches.</div>
            ) : (upcomingMatches || []).map((match, index) => (
              <motion.div
                key={match._id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 card-hover"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-yellow-700 font-semibold text-sm">SCHEDULED</span>
                  </div>
                  <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-600">
                    {match.matchType}
                  </div>
                </div>

                <div className="text-center mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center">
                      <div className="font-bold text-gray-900 mb-1">{match.teams?.[0]?.name}</div>
                      <div className="text-3xl font-bold text-primary-600">{match.teams?.[0]?.score ?? 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 text-sm mb-1">VS</div>
                      <div className="text-lg font-semibold text-gray-600">{new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900 mb-1">{match.teams?.[1]?.name}</div>
                      <div className="text-3xl font-bold text-primary-600">{match.teams?.[1]?.score ?? 0}</div>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-600 mb-4">
                  <MapPinIcon className="w-4 h-4 inline mr-1" />
                  {match.turfId?.name}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Completed Matches Section */}
      <section id="completed-matches" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Recently Completed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Finished matches sorted by most recent.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {loadingMatches ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow p-6 flex items-center justify-center text-gray-500">
                  Loading completed matches...
                </div>
              ))
            ) : (completedMatches || []).length === 0 ? (
              <div className="col-span-full text-center text-gray-600">No matches.</div>
            ) : (completedMatches || []).map((m, i) => (
              <div key={m._id || i} className="bg-white rounded-2xl shadow p-6">
                <div className="flex items-center justify-between mb-2"><span className="text-green-600 text-xs font-semibold">COMPLETED</span><span className="text-sm bg-gray-100 px-2 py-0.5 rounded">{m.matchType}</span></div>
                <div className="font-bold text-gray-900 mb-1">{m.matchName}</div>
                <div className="text-xs text-gray-500 mb-3">{new Date(m.endTime || m.startTime).toLocaleString()}</div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-center"><div className="font-medium">{m.teams?.[0]?.name}</div><div className="text-2xl font-bold text-primary-600">{m.teams?.[0]?.score ?? 0}</div></div>
                  <div className="text-gray-500">vs</div>
                  <div className="text-center"><div className="font-medium">{m.teams?.[1]?.name}</div><div className="text-2xl font-bold text-primary-600">{m.teams?.[1]?.score ?? 0}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section id="ai-features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              AI-Powered Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of sports with our intelligent features
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {aiFeatures.map((feature, index) => {
              const IconComponent = {
                UserGroupIcon,
                CalendarDaysIcon,
                ChartBarIcon,
                CubeIcon
              }[feature.icon];

              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center p-6 rounded-2xl bg-gray-50 card-hover"
                >
                  <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in just four simple steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((step, index) => {
              const IconComponent = {
                UserPlusIcon,
                MapPinIcon,
                PlayIcon,
                TrophyIcon
              }[step.icon];

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center relative"
                >
                  {index < howItWorksSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-primary-200 z-0"></div>
                  )}
                  
                  <div className="relative z-10">
                    <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-4 relative`}>
                      <IconComponent className="w-8 h-8 text-white" />
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-bold text-primary-600 border-2 border-primary-200">
                        {step.id}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Upcoming Matches Section */}
      <section id="upcoming-matches" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Upcoming Matches
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Matches starting soon. Join or watch as they go live.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {loadingMatches ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow p-6 flex items-center justify-center text-gray-500">
                  Loading upcoming matches...
                </div>
              ))
            ) : (upcomingMatches || []).length === 0 ? (
              <div className="col-span-full text-center text-gray-600">No matches.</div>
            ) : (upcomingMatches || []).map((match, index) => (
              <motion.div
                key={match._id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 card-hover"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-yellow-700 font-semibold text-sm">SCHEDULED</span>
                  </div>
                  <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-600">
                    {match.matchType}
                  </div>
                </div>

                <div className="text-center mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center">
                      <div className="font-bold text-gray-900 mb-1">{match.teams?.[0]?.name}</div>
                      <div className="text-3xl font-bold text-primary-600">{match.teams?.[0]?.score ?? 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 text-sm mb-1">VS</div>
                      <div className="text-lg font-semibold text-gray-600">{new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900 mb-1">{match.teams?.[1]?.name}</div>
                      <div className="text-3xl font-bold text-primary-600">{match.teams?.[1]?.score ?? 0}</div>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-600 mb-4">
                  <MapPinIcon className="w-4 h-4 inline mr-1" />
                  {match.turfId?.name}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Completed Matches Section */}
      <section id="completed-matches" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Recently Completed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Finished matches sorted by most recent.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {loadingMatches ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow p-6 flex items-center justify-center text-gray-500">
                  Loading completed matches...
                </div>
              ))
            ) : (completedMatches || []).length === 0 ? (
              <div className="col-span-full text-center text-gray-600">No matches.</div>
            ) : (completedMatches || []).map((m, i) => (
              <div key={m._id || i} className="bg-white rounded-2xl shadow p-6">
                <div className="flex items-center justify-between mb-2"><span className="text-green-600 text-xs font-semibold">COMPLETED</span><span className="text-sm bg-gray-100 px-2 py-0.5 rounded">{m.matchType}</span></div>
                <div className="font-bold text-gray-900 mb-1">{m.matchName}</div>
                <div className="text-xs text-gray-500 mb-3">{new Date(m.endTime || m.startTime).toLocaleString()}</div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-center"><div className="font-medium">{m.teams?.[0]?.name}</div><div className="text-2xl font-bold text-primary-600">{m.teams?.[0]?.score ?? 0}</div></div>
                  <div className="text-gray-500">vs</div>
                  <div className="text-center"><div className="font-medium">{m.teams?.[1]?.name}</div><div className="text-2xl font-bold text-primary-600">{m.teams?.[1]?.score ?? 0}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tournaments Section */}
      <section id="tournaments" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Upcoming Tournaments
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join exciting tournaments and compete with the best players
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {upcomingTournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden card-hover"
              >
                <div className="relative">
                  <img
                    src={tournament.image}
                    alt={tournament.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {tournament.sport}
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {tournament.title}
                  </h3>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <CalendarDaysIcon className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      {new Date(tournament.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-600">
                      <UserGroupIcon className="w-4 h-4 inline mr-1" />
                      {tournament.teamsJoined}/{tournament.maxTeams} teams
                    </div>
                    <div className="text-lg font-bold text-primary-600">
                      {tournament.prize}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Registration Progress</span>
                      <span>{Math.round((tournament.teamsJoined / tournament.maxTeams) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(tournament.teamsJoined / tournament.maxTeams) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <button className="w-full btn-primary">
                    Join Tournament - {tournament.registrationFee}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <button className="btn-secondary">
              View All Tournaments
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied players and turf owners
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-lg p-8 text-center"
            >
              <div className="flex justify-center mb-4">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <StarIconSolid key={i} className="w-6 h-6 text-yellow-400" />
                ))}
              </div>
              
              <p className="text-xl text-gray-700 mb-6 italic">
                "{testimonials[currentTestimonial].content}"
              </p>
              
              <div className="flex items-center justify-center">
                <img
                  src={testimonials[currentTestimonial].avatar}
                  alt={testimonials[currentTestimonial].name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <div className="font-bold text-gray-900">
                    {testimonials[currentTestimonial].name}
                  </div>
                  <div className="text-gray-600">
                    {testimonials[currentTestimonial].role}
                  </div>
                </div>
              </div>
            </motion.div>
            
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Turf Owner CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center text-white"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Are you a Turf Owner?
            </h2>
            <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">
              Join our platform and start earning today. Manage bookings, host tournaments, and grow your business with our advanced tools.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChartBarIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Increase Revenue</h3>
                <p className="text-primary-100">Maximize your turf utilization and earnings</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Reach More Players</h3>
                <p className="text-primary-100">Connect with thousands of active players</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Easy Management</h3>
                <p className="text-primary-100">Streamlined booking and payment system</p>
              </div>
            </div>
            
            <button className="bg-white text-primary-600 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105">
              Register Your Turf
              <ArrowRightIcon className="w-5 h-5 ml-2 inline" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold gradient-text mb-4">TurfEase</h3>
              <p className="text-gray-400 mb-4">
                AI-powered turf booking & management platform for sports enthusiasts.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">f</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">ig</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">tw</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">For Players</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Find Turfs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Join Matches</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tournaments</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Leaderboards</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">For Owners</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Register Turf</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Dashboard</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Analytics</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Admin Login</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 TurfEase. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
      {/* Floating AI Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default Home;
// Chat widget is mounted globally on Home
// It will render a floating button at bottom-right
// and open a small chat window when clicked.