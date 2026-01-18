import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { walletAPI, setAuthToken } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  Wallet as WalletIcon,
  CreditCard,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  Target,
  Star,
  Gift,
  Shield,
  Smartphone,
  ArrowRight,
  History,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const Wallet = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem('name');
    navigate('/login', { replace: true });
  }

  // Fetch wallet data
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: walletAPI.getWallet,
  });

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => walletAPI.getTransactions(0, 20),
  });

  // Create payment order mutation
  const createOrderMutation = useMutation({
    mutationFn: walletAPI.createPaymentOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.refetchQueries({ queryKey: ['wallet'] });
      toast.success('Credits successfully added to your wallet!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create payment order');
    },
  });

  const creditPacks = [
    {
      id: 1,
      credits: 10,
      price: 100,
      originalPrice: 120,
      discount: 17,
      popular: false,
      description: 'Perfect for trying out our platform',
      features: ['10 Interview Credits', 'CV Screening', 'Basic Support']
    },
    {
      id: 2,
      credits: 25,
      price: 225,
      originalPrice: 300,
      discount: 25,
      popular: true,
      description: 'Most popular choice for regular users',
      features: ['25 Interview Credits', 'CV Screening', 'Priority Support', 'Advanced Analytics']
    },
    {
      id: 3,
      credits: 50,
      price: 400,
      originalPrice: 600,
      discount: 33,
      popular: false,
      description: 'Great value for serious job seekers',
      features: ['50 Interview Credits', 'CV Screening', 'Priority Support', 'Advanced Analytics', 'Mock Interviews']
    },
    {
      id: 4,
      credits: 100,
      price: 750,
      originalPrice: 1200,
      discount: 38,
      popular: false,
      description: 'Best value for power users',
      features: ['100 Interview Credits', 'CV Screening', 'Priority Support', 'Advanced Analytics', 'Mock Interviews', 'Personal Coach']
    }
  ];

  const handlePurchase = (packId: number) => {
    createOrderMutation.mutate(packId);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'deduct':
        return <Zap className="h-4 w-4 text-red-600" />;
      case 'refund':
        return <ArrowRight className="h-4 w-4 text-blue-600" />;
      default:
        return <WalletIcon className="h-4 w-4 text-slate-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'text-green-600';
      case 'deduct':
        return 'text-red-600';
      case 'refund':
        return 'text-blue-600';
      default:
        return 'text-slate-600';
    }
  };

  if (walletLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">InterviewPro</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Wallet & Credits</h1>
          <p className="text-slate-600">
            Manage your credits and purchase more to continue your interview practice.
          </p>
        </div>

        {/* Wallet Balance Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Current Balance</h2>
                <div className="text-4xl font-bold mb-2">
                  {wallet?.data?.balance_credits || 0}
                </div>
                <p className="text-blue-100">Interview Credits Available</p>
              </div>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <WalletIcon className="h-10 w-10" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="purchase" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="purchase">Buy Credits</TabsTrigger>
            <TabsTrigger value="history">Transaction History</TabsTrigger>
          </TabsList>

          <TabsContent value="purchase" className="space-y-6">
            {/* Credit Packs */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Choose Your Credit Pack</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {creditPacks.map((pack) => (
                  <Card
                    key={pack.id}
                    className={`relative ${pack.popular ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                  >
                    {pack.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-600 text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <CardTitle className="text-2xl font-bold">{pack.credits}</CardTitle>
                      <CardDescription>Interview Credits</CardDescription>
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-slate-900">
                          ₹{pack.price}
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-sm text-slate-500 line-through">
                            ₹{pack.originalPrice}
                          </span>
                          <Badge variant="destructive" className="text-xs">
                            {pack.discount}% OFF
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-slate-600 text-center">
                        {pack.description}
                      </p>
                      <ul className="space-y-2">
                        {pack.features.map((feature, index) => (
                          <li key={index} className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        onClick={() => handlePurchase(pack.id)}
                        disabled={createOrderMutation.isPending}
                      >
                        {createOrderMutation.isPending ? 'Processing...' : 'Purchase Now'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Secure payment processing with multiple options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">Cards</h3>
                      <p className="text-sm text-slate-600">Credit/Debit cards</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">Secure</h3>
                      <p className="text-sm text-slate-600">SSL encrypted</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Your recent credit purchases and usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading transactions...</p>
                  </div>
                ) : transactions?.data?.transactions?.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.data.transactions.map((transaction: any) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <h3 className="font-medium text-slate-900 capitalize">
                              {transaction.type.replace('_', ' ')}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {formatDate(transaction.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${getTransactionColor(transaction.type)}`}>
                            {transaction.type === 'purchase' ? '+' : '-'}{transaction.credits} Credits
                          </div>
                          {transaction.amount_inr && (
                            <div className="text-sm text-slate-600">
                              ₹{transaction.amount_inr}
                            </div>
                          )}
                          <Badge
                            variant={transaction.status === 'success' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No transactions yet</h3>
                    <p className="text-slate-600 mb-4">Your transaction history will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Wallet;
