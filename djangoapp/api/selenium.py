# Import necessary libraries
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys  # Import Keys for keyboard actions
from selenium.common.exceptions import TimeoutException  # Add this line
import random
import string
import time  # Import the time module

### DRIVER SETUP
# Set up Chrome options
chrome_options = Options()
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")

# Create a new Chrome driver instance
driver = webdriver.Chrome(options=chrome_options)

# Navigate to the home page
driver.get('http://localhost:3000')


### CONSTANTS
run_login_tests = False
run_search_tests = True


### FUNCTIONS

# Function to perform login
def login(username, password):
    # Click the login button to open the login modal
    login_button = driver.find_element(By.XPATH, "//button[text()='Login']")
    login_button.click()
    
    # Wait for the login modal to appear
    WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.XPATH, "//input[@placeholder='Username']"))
    )
    
    # Enter username and password
    username_input = driver.find_element(By.XPATH, "//input[@placeholder='Username']")
    password_input = driver.find_element(By.XPATH, "//input[@placeholder='Password']")
    username_input.clear()
    password_input.clear()
    username_input.send_keys(username)
    password_input.send_keys(password)
    
    # Add a small wait to ensure inputs are processed
    time.sleep(0.5)  # Wait for 0.5 seconds

    # Find all login buttons and click the second one (inside the modal)
    login_buttons = driver.find_elements(By.XPATH, "//button[text()='Login']")
    if len(login_buttons) > 1:
        login_buttons[1].click()
    else:
        raise Exception("Login button in modal not found")

# Function to perform signup
def signup(username, password):
    # Click the login button to open the login modal
    login_button = driver.find_element(By.XPATH, "//button[text()='Login']")
    login_button.click()
    
    # Wait for the login modal to appear
    WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.XPATH, "//input[@placeholder='Username']"))
    )
    
    # Switch to signup form
    switch_to_signup = driver.find_element(By.XPATH, "//button[text()='Sign up']")
    switch_to_signup.click()
    
    # Enter username, password, and confirm password
    username_input = driver.find_element(By.XPATH, "//input[@placeholder='Username']")
    password_input = driver.find_element(By.XPATH, "//input[@placeholder='Password']")
    confirm_password_input = driver.find_element(By.XPATH, "//input[@placeholder='Confirm Password']")
    username_input.clear()
    password_input.clear()
    confirm_password_input.clear()
    username_input.send_keys(username)
    password_input.send_keys(password)
    confirm_password_input.send_keys(password)
    
    # Click the signup button
    submit_button = driver.find_element(By.XPATH, "//button[text()='Sign Up']")
    submit_button.click()

# Function to perform logout
def logout():
    # Wait for the logout button to be present
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//button[text()='Logout']"))
    )
    
    # Click the logout button
    logout_button = driver.find_element(By.XPATH, "//button[text()='Logout']")
    logout_button.click()

# Function to close the login modal
def close_modal():
    # Wait for the close button to be present
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//button[@aria-label='Close login modal']"))
    )
    
    # Click the close button
    close_button = driver.find_element(By.XPATH, "//button[@aria-label='Close login modal']")
    close_button.click()





### LOGIN TESTS
if run_login_tests:

    # Test login with existing user
    login('testimport4', 'password')

    # Verify login success by checking for an element that appears when logged in
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//button[text()='Logout']"))
    )

    time.sleep(0.3)

    logout()

    time.sleep(0.3)

    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//button[text()='Login']"))
    )

    # Test login with non-existing user
    random_username = ''.join(random.choices(string.ascii_letters, k=10))
    random_password = ''.join(random.choices(string.ascii_letters, k=10))
    login(random_username, random_password)

    # Close the modal after failed login
    close_modal()

    # Test signup with new user
    random_digits = ''.join([str(random.randint(0, 9)) for _ in range(4)])
    new_username = f'testuser{random_digits}'
    signup(new_username, 'password')

    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//button[text()='Logout']"))
    )

    # Test logout
    logout()

    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//button[text()='Login']"))
    )

    # Test login with newly signed up user
    login(new_username, 'password')



### SEARCH TESTS
if run_search_tests:

    # signup with new user
    random_digits = ''.join([str(random.randint(0, 9)) for _ in range(4)])
    new_username = f'testuser{random_digits}'
    signup(new_username, 'password')


    # Navigate to the search page
    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//nav//a[text()='Search']"))
    ).click()

    # Search for "Hunger Games"
    search_input = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.XPATH, "//input[@placeholder='Search for books']"))
    )
    search_input.clear()
    search_input.send_keys("Hunger Games")

    # Click the search button instead of pressing enter
    search_button = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[@class='search-button']"))
    ).click()

    # Click on the first row result (using table row)
    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//tbody/tr[1]"))
    ).click()

    # Click rating to be 'high' (actually "I liked it")
    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[text()='I liked it']"))
    ).click()

    # sleep so the recommendations can be added and we don't get simultaneous db req error
    time.sleep(2)

    # Search for "Mistborn"
    search_input = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.XPATH, "//input[@placeholder='Search for books']"))
    )
    search_input.clear()
    search_input.send_keys("Mistborn")

    # Click the search button
    search_button = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[@class='search-button']"))
    ).click()

    # Click on the second row result (using table row)
    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//tbody/tr[2]"))
    ).click()

    # Click rating to be 'high'
    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[text()='I liked it']"))
    ).click()

    # sleep so the recommendations can be added and we don't get simultaneous db req error
    time.sleep(2)

    # In the comparison that shows up, click on the first option
    comparison_options = WebDriverWait(driver, 10).until(
        EC.presence_of_all_elements_located((By.XPATH, "//div[contains(@class, 'bg-gray-200')]"))
    )
    comparison_options[0].click()

    # Search for "broken earth"
    search_input = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.XPATH, "//input[@placeholder='Search for books']"))
    )
    search_input.clear()
    search_input.send_keys("broken earth")

    # Click the search button
    search_button = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[@class='search-button']"))
    ).click()

    # Click on first result
    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//tbody/tr[1]"))
    ).click()

    # Click "Add to TBR" button
    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[text()='Add to TBR']"))
    ).click()

    # Search again for "broken earth"
    search_input.clear()
    search_input.send_keys("broken earth")
    search_button = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[@class='search-button']"))
    ).click()

    # Click on third result
    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//tbody/tr[3]"))
    ).click()

    # Click "Add to TBR" button again
    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[text()='Add to TBR']"))
    ).click()

    # Navigate to TBR page
    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//nav//a[text()='TBR']"))
    ).click()

    # Click on the first TBR book row
    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//tbody/tr[1]"))
    ).click()

    # Click on the "Rank" button that shows up
    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[text()='Rank']"))
    ).click()

    # Click the high rating ("I liked it")
    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[text()='I liked it']"))
    ).click()

    # Sleep for 0.5 seconds
    time.sleep(2)

    # In the first comparison, choose the second book
    comparison_options = WebDriverWait(driver, 10).until(
        EC.presence_of_all_elements_located((By.XPATH, "//div[contains(@class, 'bg-gray-200')]"))
    )
    comparison_options[1].click()

    # Sleep for 0.1 seconds
    time.sleep(0.1)

    # In the second comparison, choose the first book shown
    comparison_options = WebDriverWait(driver, 10).until(
        EC.presence_of_all_elements_located((By.XPATH, "//div[contains(@class, 'bg-gray-200')]"))
    )
    comparison_options[0].click()

    # Click on the one remaining TBR book row shown
    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//tbody/tr[1]"))
    ).click()

    # Click "delete" to delete it
    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[text()='Remove']"))
    ).click()

    # Navigate to the recommendations page
    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//nav//a[text()='Recommendations']"))
    ).click()

    # Go through the recommendations
    recommendation_count = 0
    while True:
        # Wait for the recommendation to be present
        try:
            recommendation = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'bg-gray-100')]"))
            )
        except TimeoutException:
            break

        # Click the positive button on the right every 3 clicks
        if recommendation_count % 3 == 0:
            WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[text()='Add to TBR']"))
            ).click()
        else:
            WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[text()='Not Interested']"))
            ).click()

        recommendation_count += 1

        # Wait 0.3 seconds between clicks
        time.sleep(0.3)

# Close the driver
# driver.quit()

