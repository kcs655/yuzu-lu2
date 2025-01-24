export interface BookType {
  id: string;
  title: string;
  author: string;
  subject: string;
  grade: number;
  details: string;
  user_id: string;
  image_url: string | null;
  updated_at: string;
  created_at: string;
  isbn: string;
}

export interface WishType {
  id: string;
  user_id: string;
  textbook_id: string;
  updated_at: string;
  created_at: string;
}

export interface RequestType {
  id: string;
  requester_id: string;
  textbook_id: string;
  updated_at: string;
  created_at: string;
  status: string; // ここに status を追加
  profiles: {
    email: string;
  }
}
