import requests
import sys
import json
import base64
from datetime import datetime
from io import BytesIO
from PIL import Image

class GoyadRevisionAPITester:
    def __init__(self, base_url="https://goya-revision.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                try:
                    error_detail = response.json().get('detail', 'No error detail')
                    details += f", Error: {error_detail}"
                except:
                    details += f", Response: {response.text[:100]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {"message": "Success"}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_subjects_endpoint(self):
        """Test subjects endpoint"""
        result = self.run_test("Get Subjects", "GET", "subjects", 200)
        if result and 'subjects' in result:
            subjects = result['subjects']
            expected_count = 10
            if len(subjects) == expected_count:
                self.log_test("Subjects Count", True, f"Found {len(subjects)} subjects")
                
                # Check if all expected subjects are present
                expected_subjects = ["maths", "francais", "histoire-geo", "emc", "svt", 
                                   "physique-chimie", "anglais", "espagnol", "musique", "arts-plastiques"]
                found_subjects = [s['id'] for s in subjects]
                missing = set(expected_subjects) - set(found_subjects)
                
                if not missing:
                    self.log_test("All Subjects Present", True)
                else:
                    self.log_test("All Subjects Present", False, f"Missing: {missing}")
            else:
                self.log_test("Subjects Count", False, f"Expected {expected_count}, got {len(subjects)}")
        return result

    def test_revision_types_endpoint(self):
        """Test revision types endpoint"""
        result = self.run_test("Get Revision Types", "GET", "revision-types", 200)
        if result and 'types' in result:
            types = result['types']
            expected_count = 5
            if len(types) == expected_count:
                self.log_test("Revision Types Count", True, f"Found {len(types)} types")
                
                # Check if all expected types are present
                expected_types = ["fiche", "qcm", "flashcard", "resume", "trous"]
                found_types = [t['id'] for t in types]
                missing = set(expected_types) - set(found_types)
                
                if not missing:
                    self.log_test("All Revision Types Present", True)
                else:
                    self.log_test("All Revision Types Present", False, f"Missing: {missing}")
            else:
                self.log_test("Revision Types Count", False, f"Expected {expected_count}, got {len(types)}")
        return result

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}"
        }
        
        result = self.run_test("User Registration", "POST", "auth/register", 200, user_data)
        if result and 'token' in result and 'user' in result:
            self.token = result['token']
            self.user_id = result['user']['id']
            self.log_test("Registration Token Received", True)
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        if not self.user_id:
            self.log_test("User Login", False, "No user registered for login test")
            return False
            
        # Use the same credentials from registration
        timestamp = datetime.now().strftime('%H%M%S')
        login_data = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        result = self.run_test("User Login", "POST", "auth/login", 200, login_data)
        if result and 'token' in result:
            self.token = result['token']
            self.log_test("Login Token Received", True)
            return True
        return False

    def test_get_current_user(self):
        """Test get current user endpoint"""
        if not self.token:
            self.log_test("Get Current User", False, "No token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.token}'}
        result = self.run_test("Get Current User", "GET", "auth/me", 200, headers=headers)
        return result is not None

    def create_test_image(self):
        """Create a simple test image in base64 format"""
        try:
            # Create a simple 100x100 red square image
            img = Image.new('RGB', (100, 100), color='red')
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            img_data = buffer.getvalue()
            return base64.b64encode(img_data).decode('utf-8')
        except Exception as e:
            print(f"Failed to create test image: {e}")
            return None

    def test_content_generation(self):
        """Test content generation endpoint"""
        test_image = self.create_test_image()
        
        # Test without authentication first
        generation_data = {
            "prompt": "Les fonctions affines en mathématiques",
            "subject": "maths",
            "revision_type": "fiche",
            "image_base64": test_image
        }
        
        result = self.run_test("Content Generation (No Auth)", "POST", "generate", 200, generation_data)
        if result and 'content' in result:
            self.log_test("Generated Content Received", True, f"Content length: {len(result['content'])}")
            
            # Check if content is not empty and contains expected elements
            content = result['content']
            if len(content) > 50:  # Reasonable content length
                self.log_test("Content Quality Check", True, "Content appears substantial")
            else:
                self.log_test("Content Quality Check", False, "Content too short")
        
        # Test with authentication if token available
        if self.token:
            headers = {'Authorization': f'Bearer {self.token}'}
            result_auth = self.run_test("Content Generation (With Auth)", "POST", "generate", 200, 
                                      generation_data, headers=headers)
            if result_auth and 'user_id' in result_auth:
                self.log_test("Authenticated Generation", True, "User ID present in response")
        
        return result

    def test_save_revision(self):
        """Test saving a revision"""
        if not self.token:
            self.log_test("Save Revision", False, "No authentication token")
            return None
            
        revision_data = {
            "prompt": "Test revision for saving",
            "subject": "maths",
            "revision_type": "fiche",
            "content": "This is test content for a saved revision."
        }
        
        headers = {'Authorization': f'Bearer {self.token}'}
        result = self.run_test("Save Revision", "POST", "revisions", 200, revision_data, headers=headers)
        
        if result and 'id' in result:
            self.saved_revision_id = result['id']
            return result
        return None

    def test_get_revisions(self):
        """Test getting saved revisions"""
        if not self.token:
            self.log_test("Get Revisions", False, "No authentication token")
            return None
            
        headers = {'Authorization': f'Bearer {self.token}'}
        result = self.run_test("Get Revisions", "GET", "revisions", 200, headers=headers)
        
        if result and isinstance(result, list):
            self.log_test("Revisions List Received", True, f"Found {len(result)} revisions")
            return result
        return None

    def test_delete_revision(self):
        """Test deleting a revision"""
        if not self.token or not hasattr(self, 'saved_revision_id'):
            self.log_test("Delete Revision", False, "No token or saved revision ID")
            return False
            
        headers = {'Authorization': f'Bearer {self.token}'}
        result = self.run_test("Delete Revision", "DELETE", f"revisions/{self.saved_revision_id}", 200, headers=headers)
        return result is not None

    def test_unauthorized_access(self):
        """Test endpoints that require authentication without token"""
        # Test saving revision without auth - should fail
        revision_data = {
            "prompt": "Test",
            "subject": "maths", 
            "revision_type": "fiche",
            "content": "Test content"
        }
        result = self.run_test("Save Revision (No Auth)", "POST", "revisions", 401, revision_data)
        
        # Test getting revisions without auth - should fail
        result = self.run_test("Get Revisions (No Auth)", "GET", "revisions", 401)
        
        # Test get current user without auth - should fail
        result = self.run_test("Get Current User (No Auth)", "GET", "auth/me", 401)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Goya Revision API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 50)
        
        # Basic endpoint tests
        self.test_root_endpoint()
        self.test_subjects_endpoint()
        self.test_revision_types_endpoint()
        
        # Authentication tests
        if self.test_user_registration():
            self.test_get_current_user()
        
        # Content generation tests
        self.test_content_generation()
        
        # CRUD operations for revisions
        if self.token:
            saved_revision = self.test_save_revision()
            if saved_revision:
                self.test_get_revisions()
                self.test_delete_revision()
        
        # Security tests
        self.test_unauthorized_access()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

def main():
    tester = GoyadRevisionAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())