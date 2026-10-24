import db from "../db/index.js";
import { product, productCategory } from "../db/schema.js";
import { eq, inArray, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { join } from "path";
import { readFile, unlink } from "fs/promises";
import sharp from "sharp";
import { config } from "../config/index.js";

function resolveImageUrl(img?: string | null): string {
  if (!img) return "";
  if (img.startsWith("http://") || img.startsWith("https://")) {
    return img;
  }
  const base = process.env.BASE_URL || "http://localhost:5000";
  return `${base}/api/products/image/${img}`;
}

function mapProductRecord(p: any) {
  return {
    ...p,
    condition: p.condition || "BRAND_NEW",
    transactionType: p.transactionType || "BUY",
    availability: p.availability || "IN_STOCK",
    sellerVerification: p.sellerVerification || "VERIFIED_DEALER",
    inspection: p.inspection || "NOT_INSPECTED",
    warranty: p.warranty || "NONE",
    delivery: p.delivery || "BUYER_PICKUP",
    imageUrl: resolveImageUrl(p.img),
  };
}

export interface CreateProductInput {
  name: string;
  price: string;
  description: string;
  categoryId: string;
  imageFile?: File | null;
  imageUrl?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  condition?: string | null;
  transactionType?: string | null;
  availability?: string | null;
  operatingHours?: number | null;
  engineHp?: number | null;
  locationCountry?: string | null;
  locationCity?: string | null;
  sellerVerification?: string | null;
  inspection?: string | null;
  warranty?: string | null;
  delivery?: string | null;
  inspectionReportUrl?: string | null;
  specifications?: string | null;
  featured?: boolean;
}

export class ProductService {
  private static instance: ProductService;
  private constructor() {}

  public static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  // Category methods
  async createCategory(name: string, code?: string, description?: string) {
    const newCategory = await db.insert(productCategory).values({
      id: uuidv4(),
      name,
      code: code || null,
      description: description || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return { success: true, categoryId: newCategory[0].id };
  }

  async updateCategory(categoryId: string, name: string, code?: string, description?: string) {
    const category = await db
      .select()
      .from(productCategory)
      .where(eq(productCategory.id, categoryId))
      .limit(1);

    if (!category.length) {
      throw new Error("Category not found");
    }

    const updateData: any = {
      name,
      updatedAt: new Date(),
    };
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;

    await db
      .update(productCategory)
      .set(updateData)
      .where(eq(productCategory.id, categoryId));

    return { success: true };
  }

  async deleteCategories(categoryIds: string[]) {
    await db
      .delete(productCategory)
      .where(inArray(productCategory.id, categoryIds));

    return { success: true, deletedCount: categoryIds.length };
  }

  async getAllCategories() {
    const categories = await db
      .select()
      .from(productCategory)
      .orderBy(productCategory.code, productCategory.name);

    // Get products for each category
    const categoriesWithProducts = await Promise.all(
      categories.map(async (category) => {
        const products = await db
          .select()
          .from(product)
          .where(eq(product.categoryId, category.id));

        return {
          ...category,
          products: products.map(mapProductRecord),
        };
      })
    );

    return categoriesWithProducts;
  }

  async getCategory(categoryId: string) {
    const category = await db
      .select()
      .from(productCategory)
      .where(eq(productCategory.id, categoryId))
      .limit(1);

    if (!category.length) {
      throw new Error("Category not found");
    }

    const products = await db
      .select()
      .from(product)
      .where(eq(product.categoryId, categoryId));

    return {
      ...category[0],
      products: products.map(mapProductRecord),
    };
  }

  // Product methods
  async createProduct(data: CreateProductInput) {
    const category = await db
      .select()
      .from(productCategory)
      .where(eq(productCategory.id, data.categoryId))
      .limit(1);

    if (!category.length) {
      throw new Error("Category not found");
    }

    let filename = data.imageUrl?.trim() || "";

    if (data.imageFile && typeof data.imageFile.arrayBuffer === "function") {
      if (!data.imageFile.type.startsWith("image/")) {
        throw new Error("File must be an image");
      }

      if (data.imageFile.size > config.upload.maxFileSize) {
        throw new Error("Image must be under 5MB");
      }

      filename = `${uuidv4()}-${data.imageFile.name}`;
      const filepath = join(config.storage.productImages, filename);

      const arrayBuffer = await data.imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await sharp(buffer)
        .resize(
          config.upload.imageProcessing.maxWidth,
          config.upload.imageProcessing.maxHeight,
          { fit: "inside" }
        )
        .jpeg({ quality: config.upload.imageProcessing.quality })
        .toFile(filepath);
    }

    if (!filename) {
      filename = "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1200&auto=format&fit=crop";
    }

    const newProduct = await db.insert(product).values({
      id: uuidv4(),
      name: data.name,
      price: data.price,
      description: data.description,
      categoryId: data.categoryId,
      make: data.make || null,
      model: data.model || null,
      year: data.year ? Number(data.year) : null,
      condition: data.condition || "BRAND_NEW",
      transactionType: data.transactionType || "BUY",
      availability: data.availability || "IN_STOCK",
      operatingHours: data.operatingHours !== undefined && data.operatingHours !== null ? Number(data.operatingHours) : null,
      engineHp: data.engineHp !== undefined && data.engineHp !== null ? Number(data.engineHp) : null,
      locationCountry: data.locationCountry || null,
      locationCity: data.locationCity || null,
      sellerVerification: data.sellerVerification || "VERIFIED_DEALER",
      inspection: data.inspection || "NOT_INSPECTED",
      warranty: data.warranty || "NONE",
      delivery: data.delivery || "BUYER_PICKUP",
      inspectionReportUrl: data.inspectionReportUrl || null,
      specifications: data.specifications || null,
      featured: data.featured ?? false,
      status: "ACTIVE",
      img: filename,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return {
      success: true,
      productId: newProduct[0].id,
      imageUrl: resolveImageUrl(filename),
    };
  }

  async updateProduct(
    productId: string,
    data: Partial<CreateProductInput> & { status?: string }
  ) {
    const productRecord = await db
      .select()
      .from(product)
      .where(eq(product.id, productId))
      .limit(1);

    if (!productRecord.length) {
      throw new Error("Product not found");
    }

    const updateData: any = { ...data };
    delete updateData.imageFile;

    if (data.categoryId) {
      const category = await db
        .select()
        .from(productCategory)
        .where(eq(productCategory.id, data.categoryId))
        .limit(1);

      if (!category.length) {
        throw new Error("Category not found");
      }
    }

    if (data.imageFile && typeof data.imageFile.arrayBuffer === "function") {
      if (!data.imageFile.type.startsWith("image/")) {
        throw new Error("File must be an image");
      }

      if (data.imageFile.size > config.upload.maxFileSize) {
        throw new Error("Image must be under 5MB");
      }

      if (productRecord[0].img && !productRecord[0].img.startsWith("http")) {
        const oldFilepath = join(config.storage.productImages, productRecord[0].img);
        try {
          await unlink(oldFilepath);
        } catch (error) {
          console.error("Error deleting old product image:", error);
        }
      }

      const filename = `${uuidv4()}-${data.imageFile.name}`;
      const filepath = join(config.storage.productImages, filename);

      const arrayBuffer = await data.imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await sharp(buffer)
        .resize(
          config.upload.imageProcessing.maxWidth,
          config.upload.imageProcessing.maxHeight,
          { fit: "inside" }
        )
        .jpeg({ quality: config.upload.imageProcessing.quality })
        .toFile(filepath);

      updateData.img = filename;
    } else if (data.imageUrl) {
      updateData.img = data.imageUrl;
    }

    if (data.year !== undefined) updateData.year = data.year ? Number(data.year) : null;
    if (data.operatingHours !== undefined) updateData.operatingHours = data.operatingHours !== null ? Number(data.operatingHours) : null;
    if (data.engineHp !== undefined) updateData.engineHp = data.engineHp !== null ? Number(data.engineHp) : null;

    updateData.updatedAt = new Date();

    await db
      .update(product)
      .set(updateData)
      .where(eq(product.id, productId));

    return {
      success: true,
      imageUrl: updateData.img ? resolveImageUrl(updateData.img) : undefined,
    };
  }

  async deleteProducts(productIds: string[]) {
    const productsToDelete = await db
      .select()
      .from(product)
      .where(inArray(product.id, productIds));

    for (const prod of productsToDelete) {
      if (prod.img && !prod.img.startsWith("http")) {
        const filepath = join(config.storage.productImages, prod.img);
        try {
          await unlink(filepath);
        } catch (error) {
          console.error(`Error deleting image for product ${prod.id}:`, error);
        }
      }
    }

    await db.delete(product).where(inArray(product.id, productIds));

    return { success: true, deletedCount: productIds.length };
  }

  async getAllProducts() {
    const products = await db
      .select()
      .from(product)
      .orderBy(product.createdAt);

    return products.map(mapProductRecord);
  }

  async getProduct(productId: string) {
    const productRecord = await db
      .select()
      .from(product)
      .where(eq(product.id, productId))
      .limit(1);

    if (!productRecord.length) {
      throw new Error("Product not found");
    }

    return mapProductRecord(productRecord[0]);
  }

  async getProductImage(filename: string) {
    const filepath = join(config.storage.productImages, filename);
    return await readFile(filepath);
  }

  async getProductStats() {
    const [
      totalProducts,
      totalCategories,
      productsByCategory,
    ] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(product)
        .then((result) => result[0].count),
      db
        .select({ count: sql<number>`count(*)` })
        .from(productCategory)
        .then((result) => result[0].count),
      db
        .select({
          categoryId: productCategory.id,
          categoryName: productCategory.name,
          categoryCode: productCategory.code,
          count: sql<number>`count(${product.id})`,
        })
        .from(productCategory)
        .leftJoin(product, eq(product.categoryId, productCategory.id))
        .groupBy(productCategory.id, productCategory.name, productCategory.code),
    ]);

    return {
      totalProducts,
      totalCategories,
      productsByCategory,
    };
  }
}
