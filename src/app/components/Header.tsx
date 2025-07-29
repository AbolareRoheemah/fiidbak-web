"use client"
import React from 'react'
import { Star, Plus, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
// import { ConnectButton } from '@rainbow-me/rainbowkit'
import { CampModal } from '@campnetwork/origin/react'

export default function Header() {
  const router = useRouter()
  
  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-4 sm:py-0 gap-4 sm:gap-0">
          {/* Logo and Title */}
          <div className="flex items-center gap-3 mb-2 sm:mb-0 cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Fiidbak</h1>
            {/* Wallet Connect */}
            <div className="flex items-center ml-4">
              {/* <ConnectButton
                showBalance={false}
                chainStatus="icon"
                accountStatus={{
                  smallScreen: 'avatar',
                  largeScreen: 'full',
                }}
              /> */}
              <CampModal />
            </div>
          </div>
          {/* Actions */}
          <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="flex items-center justify-center xs:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
              <a
                href="/upload"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden xs:inline">Add Project</span>
                <span className="inline xs:hidden">Add</span>
              </a>
              <button
                onClick={() => router.push("/products")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer"
              >
                View All Products
              </button>

              <button
                onClick={() => router.push("/user_profile")}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 transition-colors w-full sm:w-auto justify-center cursor-pointer"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 hidden xs:inline">Profile</span>
                <span className="text-sm font-medium text-gray-700 inline xs:hidden">Me</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
