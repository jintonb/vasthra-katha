import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { promises as fs } from 'fs';
import path from 'path';
import { getProductByCode, getProducts, saveProducts } from '@/lib/db';
import { isAuthorized } from '@/lib/auth';
import { NextResponse } from 'next/server';

const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.AWS_S3_BUCKET_NAME;

const isS3Configured = Boolean(accessKeyId && secretAccessKey && bucketName && region);

// Helper to delete files from AWS S3
async function deleteMediaFromS3(url) {
  if (!url || !isS3Configured) return;
  try {
    const s3Domain = `${bucketName}.s3.${region}.amazonaws.com`;
    if (!url.includes(s3Domain)) return;

    const urlObj = new URL(url);
    const key = decodeURIComponent(urlObj.pathname.replace(/^\//, ''));

    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`✓ Deleted S3 media: ${key}`);
  } catch (err) {
    console.error(`Failed to delete S3 file: ${url}`, err);
  }
}

// Helper to delete local fallback files (development environment)
async function deleteLocalMedia(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  try {
    const localPath = path.join(process.cwd(), 'public', url);
    await fs.unlink(localPath);
    console.log(`✓ Deleted local fallback file: ${localPath}`);
  } catch (err) {
    // Suppress error
  }
}

// Helper to clean up all media files associated with a product
async function cleanProductMedia(product) {
  const urls = [];
  if (product.thumbnail) urls.push(product.thumbnail);
  if (Array.isArray(product.images)) urls.push(...product.images);
  if (Array.isArray(product.videos)) urls.push(...product.videos);

  for (const url of urls) {
    if (url.startsWith('/uploads/')) {
      await deleteLocalMedia(url);
    } else {
      await deleteMediaFromS3(url);
    }
  }
}

export async function GET(request, { params }) {
  try {
    const { code } = await params;
    const product = await getProductByCode(code);

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ success: false, message: 'Unauthorized. Valid API Key or session required.' }, { status: 401 });
  }

  try {
    const { code } = await params;
    const updatedFields = await request.json();

    const products = await getProducts();
    const index = products.findIndex(p => p.code.toLowerCase() === code.toLowerCase());

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    products[index] = {
      ...products[index],
      ...updatedFields,
      code: updatedFields.code || products[index].code,
    };

    await saveProducts(products);
    return NextResponse.json({ success: true, product: products[index] });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ success: false, message: 'Unauthorized. Valid API Key or session required.' }, { status: 401 });
  }

  try {
    const { code } = await params;
    const products = await getProducts();
    const index = products.findIndex(p => p.code.toLowerCase() === code.toLowerCase());

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    const productToDelete = products[index];

    // 1. Clean up associated media from S3 and local files
    await cleanProductMedia(productToDelete);

    // 2. Remove the product record from array
    const filteredProducts = products.filter(p => p.code.toLowerCase() !== code.toLowerCase());
    await saveProducts(filteredProducts);

    return NextResponse.json({ success: true, message: 'Product and associated media deleted successfully' });
  } catch (error) {
    console.error('Delete product route error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
