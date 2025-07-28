import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CampModal } from '@campnetwork/origin/react';

import { useAccount } from 'wagmi';
import { useAuth } from '@campnetwork/origin/react';


export default function HybridAuthButton() {
    const { isLoggedIn, hasWallet, hasSocial, primaryId, authType } = useUnifiedAuth();
    console.log("im in inn", isLoggedIn)


function useUnifiedAuth() {
  // RainbowKit/Wagmi state
  const { address, isConnected } = useAccount();
  
  // Origin SDK state
  const { isAuthenticated, userId } = useAuth();
  
  // Combined authentication state
  const isLoggedIn = isConnected || isAuthenticated;
  
  const authData = {
    // Authentication status
    isLoggedIn,
    hasWallet: isConnected,
    hasSocial: isAuthenticated,
    
    // User identifiers
    walletAddress: address,
    socialUser: userId,
    
    // Primary identifier (prefer social username over wallet)
    primaryId: userId || address || 'Anonymous',
    
    // Authentication type
    authType: isAuthenticated ? 'social' : isConnected ? 'wallet' : 'none'
  };
  
  return authData;
}
    if (isLoggedIn) {
      console.log("logged inn", isLoggedIn)
      return (
        <div className="auth-status">
          <div className="user-info">
            <span>Welcome, {primaryId}</span>
            <div className="auth-badges">
              {hasWallet && <span className="badge wallet">🔗 Wallet</span>}
              {hasSocial && <span className="badge social">👤 Social</span>}
            </div>
          </div>
          
          {/* Allow users to connect additional auth methods */}
          <div className="additional-connections">
            {!hasWallet && <ConnectButton />}
            {!hasSocial && <CampModal />}
          </div>
        </div>
      );
    }
    
    return (
      <div className="auth-options">
        <h3>Choose how to connect:</h3>
        
        <div className="auth-methods">
          <div className="auth-option">
            <h4>🔗 Connect Wallet</h4>
            <p>Use your crypto wallet (MetaMask, etc.)</p>
            <ConnectButton />
          </div>
          
          <div className="auth-divider">OR</div>
          
          <div className="auth-option">
            <h4>👤 Connect Social</h4>
            <p>Use Twitter, Spotify, etc.</p>
            <CampModal />
          </div>
        </div>
      </div>
    );
  }