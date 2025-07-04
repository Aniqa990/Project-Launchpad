import axios from "axios";
import type {FreelancerProfile, LoginResponse, SignupRequest, User} from "@/types";

const api = axios.create({
  baseURL: "http://localhost:7071/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const loginUser = async (email: string, password: string, role: string)=>{
  const response = await api.post('/auth/login', { email, password, role });
  return response.data;
};

export const signupUser = async (userData: Partial<SignupRequest>)=> {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const addFreelancerProfile = async(profile: Partial<FreelancerProfile>) => {
  try{
  const response = await api.post("/freelancer", profile);
  return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to save profile');
  }
};
