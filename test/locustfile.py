from locust import HttpUser, task, between

# # 🔐 Test du login POST
# class LoginUserTest(HttpUser):
#     wait_time = between(1, 2)

#     @task
#     def login(self):        
#         self.client.post("/identity/login", json={
#             "email": "jean@gmail.com",
#             "password": "1234"}
#         )

# 🔓 Test GET d’un utilisateur par ID
# class GetUserByIdTest(HttpUser):
#     wait_time = between(1, 2)

#     @task
#     def get_user(self):        
#         self.client.get("/identity/get_user_by_id/" + "5b9009cc-00c6-4b17-8e1f-3115dd63d765")

# class GetUserByEmailTest(HttpUser):
#     wait_time = between(1, 2)

#     @task
#     def get_user(self):        
#         self.client.get("/identity/get_user_by_email/" + "test@gmail.com")


# class GetTripByIdTest(HttpUser):
#     wait_time = between(1, 2)

#     @task
#     def get_user(self):        
#         self.client.get("/tp/get_trip_by_id/" + "01394624-e082-4db9-be15-ab111191ada3")


class GetTRIP(HttpUser):
    wait_time=between(1,2)

    @task
    def get_user(self):
        self.client.get("/tp/search_trips?departure_city=montreal&destination_city=mirabel&departure_date=2025-08-10&status=pending")


