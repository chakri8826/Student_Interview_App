#!/usr/bin/env python3
"""
Test script for Payment Routes
Run this after starting the server: python test_payment_routes.py
"""

import requests
import json

BASE_URL = "http://localhost:8000"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"

def test_payment_routes():
    print("🧪 Testing Payment Routes...")
    
    # Step 1: Register user
    print("\n1. Registering user...")
    register_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    try:
        register_response = requests.post(f"{BASE_URL}/api/v1/auth/register", json=register_data)
        print(f"Register Status: {register_response.status_code}")
        if register_response.status_code == 200:
            print("✅ User registered successfully")
        elif register_response.status_code == 400:
            print("ℹ️ User already exists, continuing...")
        else:
            print(f"❌ Register failed: {register_response.text}")
            return
    except Exception as e:
        print(f"❌ Register error: {e}")
        return
    
    # Step 2: Login to get token
    print("\n2. Logging in...")
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    try:
        login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)
        print(f"Login Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            access_token = token_data.get("access_token")
            print("✅ Login successful")
            print(f"Token: {access_token[:20]}...")
        else:
            print(f"❌ Login failed: {login_response.text}")
            return
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # Step 3: Test GET /wallet
    print("\n3. Testing GET /wallet...")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        wallet_response = requests.get(f"{BASE_URL}/api/v1/wallet", headers=headers)
        print(f"Wallet Status: {wallet_response.status_code}")
        
        if wallet_response.status_code == 200:
            wallet_data = wallet_response.json()
            print("✅ Wallet endpoint working")
            print(f"Balance: {wallet_data.get('balance_credits')} credits")
            print(f"Transactions: {len(wallet_data.get('last_transactions', []))}")
        else:
            print(f"❌ Wallet failed: {wallet_response.text}")
    except Exception as e:
        print(f"❌ Wallet error: {e}")
    
    # Step 4: Test POST /payments/order
    print("\n4. Testing POST /payments/order...")
    order_data = {"pack_id": 1}
    
    try:
        order_response = requests.post(f"{BASE_URL}/api/v1/payments/order", 
                                     json=order_data, headers=headers)
        print(f"Order Status: {order_response.status_code}")
        
        if order_response.status_code == 200:
            order_result = order_response.json()
            print("✅ Payment order created")
            print(f"Order ID: {order_result.get('order_id')}")
            print(f"Amount: ₹{order_result.get('amount')}")
        else:
            print(f"❌ Order failed: {order_response.text}")
    except Exception as e:
        print(f"❌ Order error: {e}")
    
    # Step 5: Test GET /transactions
    print("\n5. Testing GET /transactions...")
    
    try:
        transactions_response = requests.get(f"{BASE_URL}/api/v1/transactions?skip=0&limit=10", 
                                           headers=headers)
        print(f"Transactions Status: {transactions_response.status_code}")
        
        if transactions_response.status_code == 200:
            transactions_data = transactions_response.json()
            print("✅ Transactions endpoint working")
            print(f"Total transactions: {transactions_data.get('total')}")
        else:
            print(f"❌ Transactions failed: {transactions_response.text}")
    except Exception as e:
        print(f"❌ Transactions error: {e}")
    
    # Step 6: Test invalid pack_id
    print("\n6. Testing invalid pack_id...")
    invalid_order_data = {"pack_id": 999}
    
    try:
        invalid_order_response = requests.post(f"{BASE_URL}/api/v1/payments/order", 
                                             json=invalid_order_data, headers=headers)
        print(f"Invalid Order Status: {invalid_order_response.status_code}")
        
        if invalid_order_response.status_code == 400:
            print("✅ Invalid pack_id correctly rejected")
        else:
            print(f"❌ Should have rejected invalid pack_id: {invalid_order_response.text}")
    except Exception as e:
        print(f"❌ Invalid order test error: {e}")
    
    print("\n🎉 Payment routes testing completed!")

if __name__ == "__main__":
    test_payment_routes()




