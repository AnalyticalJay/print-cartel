import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { Copy, Gift, Users, TrendingUp, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export function ReferralProgram() {
  const [copied, setCopied] = useState(false);

  const { data: referralStats, isLoading: statsLoading } = trpc.referral.getMyReferralStats.useQuery();
  const { data: referrals, isLoading: referralsLoading } = trpc.referral.getMyReferrals.useQuery();

  const handleCopyCode = () => {
    if (referralStats?.referralCode) {
      navigator.clipboard.writeText(referralStats.referralCode);
      setCopied(true);
      toast.success('Referral code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareLink = () => {
    if (referralStats?.referralCode) {
      const shareUrl = `${window.location.origin}?ref=${referralStats.referralCode}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied!');
    }
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-gray-400">Loading referral program...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Referrals</p>
                <p className="text-3xl font-bold text-white">{referralStats?.totalReferrals || 0}</p>
              </div>
              <Users className="w-10 h-10 text-accent opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Rewards</p>
                <p className="text-3xl font-bold text-white">
                  R{parseFloat(referralStats?.totalRewardValue || '0').toFixed(2)}
                </p>
              </div>
              <Gift className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Discount Offered</p>
                <p className="text-3xl font-bold text-white">{referralStats?.discountPercentage}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Your Referral Code
          </CardTitle>
          <CardDescription>Share this code with friends to earn rewards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={referralStats?.referralCode || ''}
              readOnly
              className="bg-gray-700 border-gray-600 text-white font-mono text-lg"
            />
            <Button
              onClick={handleCopyCode}
              variant="outline"
              className="whitespace-nowrap"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
            <p className="text-sm text-gray-300 mb-3">Share this link with friends:</p>
            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}?ref=${referralStats?.referralCode || ''}`}
                readOnly
                className="bg-gray-600 border-gray-500 text-white text-sm"
              />
              <Button
                onClick={handleShareLink}
                variant="outline"
                className="whitespace-nowrap"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
            <p className="text-sm text-blue-200">
              💡 <strong>How it works:</strong> When friends use your code or link, they get {referralStats?.discountPercentage}% off their first order, and you earn rewards for each successful referral!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Your Referrals</CardTitle>
          <CardDescription>Track your referrals and rewards</CardDescription>
        </CardHeader>
        <CardContent>
          {referralsLoading ? (
            <p className="text-gray-400">Loading referrals...</p>
          ) : referrals && referrals.length > 0 ? (
            <div className="space-y-3">
              {referrals.map((referral: any) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600"
                >
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{referral.referredEmail}</p>
                    <p className="text-xs text-gray-400">
                      Referred on {new Date(referral.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-white font-semibold">
                        R{parseFloat(referral.rewardAmount || '0').toFixed(2)}
                      </p>
                      <Badge
                        className={
                          referral.status === 'completed'
                            ? 'bg-green-600 text-white'
                            : referral.status === 'pending'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-600 text-white'
                        }
                      >
                        {referral.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Gift className="w-12 h-12 mx-auto mb-3 text-gray-500 opacity-50" />
              <p className="text-gray-400">No referrals yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Share your referral code to start earning rewards!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
