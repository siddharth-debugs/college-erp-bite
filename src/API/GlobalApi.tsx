 
import Notifier from '../Utils/notifier';
import Session from '../Utils/session';
import HTTP from './Http';


   const BASE_URL = `${import.meta.env.VITE_API_DEV_URL}api/v1/`;
  //  const BASE_URL =  "http://192.168.1.27:9000/api/v1/";
  // const api = 'http://192.168.1.27:9000/api/v1/'

const methods = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
};

export const Postdata = async (url: string, data: any): Promise<any> => {
  const fullUrl = BASE_URL + url;
  return await HTTP.Request(methods.POST, fullUrl, data);
};

export const GetData = async (url: string): Promise<any> => {
  const fullUrl = BASE_URL + url;
  return await HTTP.Request(methods.GET, fullUrl);
};

export const GetDataById = async (url: string, id: string | number): Promise<any> => {
  const fullUrl = `${BASE_URL}${url}/${id}`;
  return await HTTP.Request(methods.GET, fullUrl);
};

export const UpdateData = async (url: string, data: any): Promise<any> => {
  const fullUrl = BASE_URL + url;
  return await HTTP.Request(methods.PUT, fullUrl, data);
};

export const DeleteData = async (url: string): Promise<any> => {
  const fullUrl = BASE_URL + url;
  return await HTTP.Request(methods.DELETE, fullUrl);
};

export const Patchdata = async (url: string, data: any): Promise<any> => {
  const fullUrl = BASE_URL + url;
  return await HTTP.Request(methods.PATCH, fullUrl, data);
};

export const GetBlob = async (url: string): Promise<Blob> => {
  const fullUrl = BASE_URL + url;

  try {
    const token = Session.get('token');
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        ...(token && { 'Authorization': `Token ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error fetching blob:', error);
    throw error;
  }
};

export const PostBlob = async (url: string, bodyData: any = {}): Promise<Blob> => {
  try {
    const token = Session.get('token');
    const fullUrl = BASE_URL + url;
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Token ${token}` }),
      },
      body: JSON.stringify(bodyData),
    });

    if (!response.ok) {
      throw new Error('Network error or unauthorized');
    }

    return await response.blob();
  } catch (error) {
    console.error('❌ Error downloading blob:', error);
    Notifier.error(error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};
