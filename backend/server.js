require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = Number(process.env.PORT) || 3038;

app.use(cors({ origin: true }));
app.use(express.json());

// 🔌 ตั้งค่าการเชื่อมต่อ Supabase จาก environment
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yrtwfhbdrqtuiirvizne.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlydHdmaGJkcnF0dWlpcnZpem5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3ODExNDcsImV4cCI6MjA5OTM1NzE0N30.kbEWEIpztsjCwIyS2qpgbighYyGqL-W2KSKsObzlKT4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. หน้าแรกทดสอบ Server
app.get('/', (req, res) => {
  res.send('Backend is running on Cloud with Supabase!');
});

// 2. [GET] ดึงข้อมูลสินค้าทั้งหมด
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. [POST] เพิ่มสินค้าใหม่
app.post('/api/products', async (req, res) => {
  try {
    const { id, created_at, price, oldPrice, old_price, rating, ...rest } = req.body;

    const newProduct = {
      ...rest,
      price: Number(price) || 0,
      oldPrice: oldPrice ?? old_price ? Number(oldPrice ?? old_price) : null,
      rating: rating ? Number(rating) : 5,
    };

    const { data, error } = await supabase
      .from('products')
      .insert([newProduct])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. [PUT] แก้ไขข้อมูลสินค้าตาม ID ✨
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = Number(id); // แปลง ID เป็น Number

    const { id: bodyId, created_at, price, oldPrice, old_price, rating, ...updateData } = req.body;

    const payload = {
      ...updateData,
      ...(price !== undefined && { price: Number(price) }),
      ...((oldPrice !== undefined || old_price !== undefined) && { oldPrice: (oldPrice ?? old_price) ? Number(oldPrice ?? old_price) : null }),
      ...(rating !== undefined && { rating: Number(rating) }),
    };

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', numericId)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Product not found in database' });
    }

    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. [DELETE] ลบสินค้าตาม ID ✨
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = Number(id);

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', numericId);

    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});