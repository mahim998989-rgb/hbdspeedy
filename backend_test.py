#!/usr/bin/env python3
"""
Backend API Testing for HBD Speedy Telegram Mini Web App
Testing enhanced admin panel APIs
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://deploy-app-21.preview.emergentagent.com/api"
ADMIN_USERNAME = "Noone55550"
ADMIN_PASSWORD = "mahim200m"

class APITester:
    def __init__(self):
        self.admin_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def test_admin_login(self):
        """Test admin login and get JWT token"""
        print("\n=== Testing Admin Login ===")
        
        try:
            response = requests.post(
                f"{BASE_URL}/admin/login",
                json={
                    "username": ADMIN_USERNAME,
                    "password": ADMIN_PASSWORD
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data:
                    self.admin_token = data["token"]
                    self.log_test("Admin Login", True, f"Token received: {self.admin_token[:20]}...")
                    return True
                else:
                    self.log_test("Admin Login", False, "No token in response")
                    return False
            else:
                self.log_test("Admin Login", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            return False
    
    def get_auth_headers(self):
        """Get authorization headers with admin token"""
        if not self.admin_token:
            return {}
        return {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_admin_stats(self):
        """Test enhanced admin stats API"""
        print("\n=== Testing Enhanced Admin Stats API ===")
        
        try:
            response = requests.get(
                f"{BASE_URL}/admin/stats",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for required fields
                required_fields = [
                    "total_users", "total_points", "pending_withdrawals", "total_tasks",
                    "total_task_completions", "total_checkins", "total_referrals", 
                    "join_bonus_claimed", "users_today"
                ]
                
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Enhanced Admin Stats API", True, 
                                f"All required fields present. Users: {data.get('total_users')}, "
                                f"Points: {data.get('total_points')}, Today: {data.get('users_today')}")
                    return True
                else:
                    self.log_test("Enhanced Admin Stats API", False, 
                                f"Missing fields: {missing_fields}")
                    return False
            else:
                self.log_test("Enhanced Admin Stats API", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Enhanced Admin Stats API", False, f"Exception: {str(e)}")
            return False
    
    def test_admin_users_list(self):
        """Test admin users list API"""
        print("\n=== Testing Admin Users List API ===")
        
        try:
            response = requests.get(
                f"{BASE_URL}/admin/users",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    if len(data) > 0:
                        # Check if users have required fields
                        user = data[0]
                        required_fields = ["telegram_id", "username", "tasks_completed", "withdrawal_count"]
                        missing_fields = [field for field in required_fields if field not in user]
                        
                        if not missing_fields:
                            # Check if sorted by join_date descending (newest first)
                            if len(data) > 1:
                                first_date = data[0].get('join_date', '')
                                second_date = data[1].get('join_date', '')
                                sorted_correctly = first_date >= second_date
                                
                                self.log_test("Admin Users List API", True, 
                                            f"Found {len(data)} users with required fields. "
                                            f"Sorted correctly: {sorted_correctly}")
                            else:
                                self.log_test("Admin Users List API", True, 
                                            f"Found {len(data)} user with required fields")
                            return True
                        else:
                            self.log_test("Admin Users List API", False, 
                                        f"Missing fields in user data: {missing_fields}")
                            return False
                    else:
                        self.log_test("Admin Users List API", True, "Empty user list (no users in system)")
                        return True
                else:
                    self.log_test("Admin Users List API", False, "Response is not a list")
                    return False
            else:
                self.log_test("Admin Users List API", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Users List API", False, f"Exception: {str(e)}")
            return False
    
    def test_user_details_api(self):
        """Test user details API"""
        print("\n=== Testing User Details API ===")
        
        # First get a user from the users list
        try:
            response = requests.get(
                f"{BASE_URL}/admin/users",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_test("User Details API", False, "Could not get users list for testing")
                return False
                
            users = response.json()
            if not users or len(users) == 0:
                self.log_test("User Details API", True, "No users to test with (empty system)")
                return True
                
            # Test with first user
            test_telegram_id = users[0]['telegram_id']
            
            response = requests.get(
                f"{BASE_URL}/admin/users/{test_telegram_id}",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for required fields
                required_fields = ["user", "completed_tasks", "withdrawals", "referral_milestones", "referred_users"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    user_info = data["user"]
                    completed_tasks = data["completed_tasks"]
                    withdrawals = data["withdrawals"]
                    
                    self.log_test("User Details API", True, 
                                f"User {user_info.get('username')} details retrieved. "
                                f"Tasks: {len(completed_tasks)}, Withdrawals: {len(withdrawals)}")
                    return True
                else:
                    self.log_test("User Details API", False, 
                                f"Missing fields: {missing_fields}")
                    return False
            else:
                self.log_test("User Details API", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User Details API", False, f"Exception: {str(e)}")
            return False
    
    def test_recent_activities_api(self):
        """Test recent activities API"""
        print("\n=== Testing Recent Activities API ===")
        
        try:
            response = requests.get(
                f"{BASE_URL}/admin/recent-activities?limit=30",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    if len(data) > 0:
                        # Check activity structure
                        activity = data[0]
                        required_fields = ["type", "telegram_id", "username", "timestamp", "description"]
                        missing_fields = [field for field in required_fields if field not in activity]
                        
                        if not missing_fields:
                            # Check for valid activity types
                            valid_types = ["user_joined", "task_completed", "withdrawal", "checkin"]
                            activity_types = [act.get("type") for act in data]
                            invalid_types = [t for t in activity_types if t not in valid_types]
                            
                            if not invalid_types:
                                self.log_test("Recent Activities API", True, 
                                            f"Found {len(data)} activities with valid structure and types")
                                return True
                            else:
                                self.log_test("Recent Activities API", False, 
                                            f"Invalid activity types found: {set(invalid_types)}")
                                return False
                        else:
                            self.log_test("Recent Activities API", False, 
                                        f"Missing fields in activity: {missing_fields}")
                            return False
                    else:
                        self.log_test("Recent Activities API", True, "No recent activities (empty system)")
                        return True
                else:
                    self.log_test("Recent Activities API", False, "Response is not a list")
                    return False
            else:
                self.log_test("Recent Activities API", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Recent Activities API", False, f"Exception: {str(e)}")
            return False
    
    def test_task_stats_api(self):
        """Test task stats API"""
        print("\n=== Testing Task Stats API ===")
        
        try:
            response = requests.get(
                f"{BASE_URL}/admin/task-stats",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    if len(data) > 0:
                        # Check task stats structure
                        task_stat = data[0]
                        required_fields = ["task_id", "title", "completion_count", "total_points_awarded"]
                        missing_fields = [field for field in required_fields if field not in task_stat]
                        
                        if not missing_fields:
                            total_completions = sum(task.get("completion_count", 0) for task in data)
                            total_points_awarded = sum(task.get("total_points_awarded", 0) for task in data)
                            
                            self.log_test("Task Stats API", True, 
                                        f"Found {len(data)} tasks. Total completions: {total_completions}, "
                                        f"Total points awarded: {total_points_awarded}")
                            return True
                        else:
                            self.log_test("Task Stats API", False, 
                                        f"Missing fields in task stats: {missing_fields}")
                            return False
                    else:
                        self.log_test("Task Stats API", True, "No tasks in system")
                        return True
                else:
                    self.log_test("Task Stats API", False, "Response is not a list")
                    return False
            else:
                self.log_test("Task Stats API", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Task Stats API", False, f"Exception: {str(e)}")
            return False
    
    def test_unauthorized_access(self):
        """Test that admin endpoints require authentication"""
        print("\n=== Testing Unauthorized Access Protection ===")
        
        endpoints = [
            "/admin/stats",
            "/admin/users", 
            "/admin/recent-activities",
            "/admin/task-stats"
        ]
        
        all_protected = True
        
        for endpoint in endpoints:
            try:
                response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
                if response.status_code in [401, 403]:
                    print(f"   ✅ {endpoint} properly protected")
                else:
                    print(f"   ❌ {endpoint} not protected (status: {response.status_code})")
                    all_protected = False
            except Exception as e:
                print(f"   ❌ {endpoint} test failed: {str(e)}")
                all_protected = False
        
        self.log_test("Unauthorized Access Protection", all_protected, 
                    "All admin endpoints require authentication" if all_protected else "Some endpoints not protected")
        return all_protected
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests for HBD Speedy Admin Panel")
        print(f"Testing against: {BASE_URL}")
        print("=" * 60)
        
        # Test admin login first
        if not self.test_admin_login():
            print("\n❌ Cannot proceed without admin token")
            return False
        
        # Run all admin API tests
        tests = [
            self.test_admin_stats,
            self.test_admin_users_list,
            self.test_user_details_api,
            self.test_recent_activities_api,
            self.test_task_stats_api,
            self.test_unauthorized_access
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Admin panel backend is working correctly.")
            return True
        else:
            print(f"⚠️  {total - passed} tests failed. Check the details above.")
            return False

def main():
    """Main test runner"""
    tester = APITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/test_results_detailed.json', 'w') as f:
        json.dump(tester.test_results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())