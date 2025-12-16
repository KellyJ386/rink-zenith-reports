import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import maxFacilityLogo from "@/assets/max-facility-logo.png";
import {
  Snowflake,
  ClipboardList,
  Wrench,
  Thermometer,
  Wind,
  Calendar,
  AlertCircle,
  MessageSquare,
  Shield,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import authRinkBg from "@/assets/auth-rink.jpg";

const Index = () => {
  const features = [
    {
      icon: Snowflake,
      title: "Ice Depth Log",
      description: "Advanced AI-powered ice measurement tracking with automated analysis and recommendations",
    },
    {
      icon: Wrench,
      title: "Ice Maintenance",
      description: "Comprehensive resurfacing logs, blade changes, and digital pre-operation checks",
    },
    {
      icon: Thermometer,
      title: "Refrigeration Log",
      description: "Monitor compressor and condenser performance with automated alert systems",
    },
    {
      icon: Wind,
      title: "Air Quality",
      description: "Track CO and NO2 levels with compliance dashboards and safety alerts",
    },
    {
      icon: Calendar,
      title: "Employee Scheduling",
      description: "Intuitive scheduling with hour tracking, shift management, and staff notifications",
    },
    {
      icon: AlertCircle,
      title: "Incident Reports",
      description: "Detailed incident documentation with body diagrams and digital signatures",
    },
    {
      icon: MessageSquare,
      title: "Communications",
      description: "Centralized team messaging with priority levels and threaded conversations",
    },
    {
      icon: Shield,
      title: "Safety Center",
      description: "Compliance tracking, audit trails, and quick access to emergency procedures",
    },
  ];

  const benefits = [
    "Cloud-based access from anywhere",
    "Real-time data synchronization",
    "Customizable reports and analytics",
    "Mobile-friendly interface",
    "Secure data encryption",
    "Role-based permissions",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden">
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${authRinkBg})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-seahawks-green/75 via-seahawks-navy/85 to-seahawks-navy/95" />
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex flex-col items-center mb-8">
              <img 
                src={maxFacilityLogo} 
                alt="Max Facility" 
                className="h-24 md:h-36 object-contain"
              />
              <h1 className="font-bebas font-bold text-5xl md:text-7xl text-white tracking-wider mt-2 drop-shadow-2xl">
                RINK REPORTS
              </h1>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight text-center">
              The All-in-One Digital Operating System for Ice Rink Facilities
            </h2>

            <p className="text-xl text-white/90 mb-8 leading-relaxed text-center">
              Streamline operations, ensure safety compliance, and optimize ice quality
              with our comprehensive facility management platform.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" className="bg-green-500 hover:bg-green-600 text-white shadow-lg">
                <Link to="/auth">
                  Sign In <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-background to-seahawks-light">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-4">Complete Facility Management</h2>
            <p className="text-xl text-muted-foreground">
              Eight powerful modules working together to keep your rink running smoothly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="hover:shadow-[var(--shadow-seahawks)] transition-all duration-300 hover:-translate-y-1"
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-seahawks-navy to-seahawks-green flex items-center justify-center mb-3">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription className="text-sm">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-b from-seahawks-light to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">Why Choose Rink Reports?</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Built specifically for ice rink facilities, our platform combines
                  industry best practices with cutting-edge technology.
                </p>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-lg">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="shadow-[var(--shadow-seahawks)]">
                <CardHeader>
                  <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
                  <CardDescription>
                    Join leading ice rink facilities using Rink Reports to optimize operations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild size="lg" className="w-full">
                    <Link to="/auth">
                      Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    No credit card required
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Snowflake className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Rink Reports</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Rink Reports. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
