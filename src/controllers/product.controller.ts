import type { Context } from "hono";
import { ProductService } from "../services/product.service.js";

const productService = ProductService.getInstance();

export class ProductController {
  // Category controllers
  static async createCategory(c: Context) {
    try {
      const { name, code, description } = await c.req.json();

      if (!name || typeof name !== "string") {
        return c.json({ error: "Name is required and must be a string" }, 400);
      }

      const result = await productService.createCategory(name, code, description);
      return c.json(result, 201);
    } catch (error) {
      console.error("Error creating category:", error);
      return c.json(
        {
          error: error instanceof Error ? error.message : "Failed to create category",
        },
        500
      );
    }
  }

  static async updateCategory(c: Context) {
    try {
      const categoryId = c.req.param("id");
      const { name, code, description } = await c.req.json();

      if (!name || typeof name !== "string") {
        return c.json({ error: "Name is required and must be a string" }, 400);
      }

      const result = await productService.updateCategory(categoryId, name, code, description);
      return c.json(result, 200);
    } catch (error) {
      console.error("Error updating category:", error);
      return c.json(
        {
          error: error instanceof Error ? error.message : "Failed to update category",
        },
        error instanceof Error && error.message.includes("not found") ? 404 : 500
      );
    }
  }

  static async deleteCategories(c: Context) {
    try {
      const { categoryIds } = await c.req.json();

      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        return c.json(
          { error: "categoryIds must be a non-empty array" },
          400
        );
      }

      const result = await productService.deleteCategories(categoryIds);
      return c.json(result, 200);
    } catch (error) {
      console.error("Error deleting categories:", error);
      return c.json(
        {
          error: error instanceof Error ? error.message : "Failed to delete categories",
        },
        500
      );
    }
  }

  static async getAllCategories(c: Context) {
    try {
      const categoriesWithProducts = await productService.getAllCategories();
      return c.json({
        data: categoriesWithProducts.map(category => ({
          id: category.id,
          code: category.code,
          name: category.name,
          description: category.description,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
          productsCount: category.products.length,
          products: category.products.map(product => ({
            id: product.id,
            name: product.name,
            make: product.make,
            model: product.model,
            year: product.year,
            condition: product.condition,
            transactionType: product.transactionType,
            availability: product.availability,
            price: product.price,
            operatingHours: product.operatingHours,
            engineHp: product.engineHp,
            locationCountry: product.locationCountry,
            locationCity: product.locationCity,
            sellerVerification: product.sellerVerification,
            inspection: product.inspection,
            warranty: product.warranty,
            delivery: product.delivery,
            inspectionReportUrl: product.inspectionReportUrl,
            specifications: product.specifications,
            featured: product.featured,
            status: product.status,
            img: product.img,
            imageUrl: product.imageUrl,
            description: product.description,
            categoryId: product.categoryId,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
          })),
        })),
      }, 200);
    } catch (error) {
      console.error("Error getting categories:", error);
      return c.json(
        {
          error: error instanceof Error ? error.message : "Failed to get categories",
        },
        500
      );
    }
  }

  static async getCategory(c: Context) {
    try {
      const categoryId = c.req.param("id");
      const categoryWithProducts = await productService.getCategory(categoryId);

      return c.json({
        id: categoryWithProducts.id,
        code: categoryWithProducts.code,
        name: categoryWithProducts.name,
        description: categoryWithProducts.description,
        createdAt: categoryWithProducts.createdAt,
        updatedAt: categoryWithProducts.updatedAt,
        productsCount: categoryWithProducts.products.length,
        products: categoryWithProducts.products.map(product => ({
          id: product.id,
          name: product.name,
          make: product.make,
          model: product.model,
          year: product.year,
          condition: product.condition,
          transactionType: product.transactionType,
          availability: product.availability,
          price: product.price,
          operatingHours: product.operatingHours,
          engineHp: product.engineHp,
          locationCountry: product.locationCountry,
          locationCity: product.locationCity,
          sellerVerification: product.sellerVerification,
          inspection: product.inspection,
          warranty: product.warranty,
          delivery: product.delivery,
          inspectionReportUrl: product.inspectionReportUrl,
          specifications: product.specifications,
          featured: product.featured,
          status: product.status,
          img: product.img,
          imageUrl: product.imageUrl,
          description: product.description,
          categoryId: product.categoryId,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        })),
      }, 200);
    } catch (error) {
      console.error("Error getting category:", error);
      return c.json(
        {
          error: error instanceof Error ? error.message : "Failed to get category",
        },
        error instanceof Error && error.message.includes("not found") ? 404 : 500
      );
    }
  }

  // Product controllers
  static async createProduct(c: Context) {
    try {
      const formData = await c.req.formData();
      const name = formData.get("name") as string;
      const price = formData.get("price") as string;
      const description = formData.get("description") as string;
      const categoryId = formData.get("categoryId") as string;
      const imageFile = formData.get("image") as File | null;
      const imageUrl = (formData.get("imageUrl") as string) || (formData.get("img") as string) || null;

      if (!name || !price || !description || !categoryId) {
        return c.json(
          { error: "name, price, description, and categoryId are required" },
          400
        );
      }

      const make = (formData.get("make") as string) || null;
      const model = (formData.get("model") as string) || null;
      const yearStr = formData.get("year");
      const year = yearStr ? Number(yearStr) : null;
      const condition = (formData.get("condition") as string) || "BRAND_NEW";
      const transactionType = (formData.get("transactionType") as string) || "BUY";
      const availability = (formData.get("availability") as string) || "IN_STOCK";
      const operatingHoursStr = formData.get("operatingHours");
      const operatingHours = operatingHoursStr ? Number(operatingHoursStr) : null;
      const engineHpStr = formData.get("engineHp");
      const engineHp = engineHpStr ? Number(engineHpStr) : null;
      const locationCountry = (formData.get("locationCountry") as string) || null;
      const locationCity = (formData.get("locationCity") as string) || null;
      const sellerVerification = (formData.get("sellerVerification") as string) || "VERIFIED_DEALER";
      const inspection = (formData.get("inspection") as string) || "NOT_INSPECTED";
      const warranty = (formData.get("warranty") as string) || "NONE";
      const delivery = (formData.get("delivery") as string) || "BUYER_PICKUP";
      const inspectionReportUrl = (formData.get("inspectionReportUrl") as string) || null;
      const specifications = (formData.get("specifications") as string) || null;
      const featured = formData.get("featured") === "true";

      const result = await productService.createProduct({
        name,
        price,
        description,
        categoryId,
        imageFile: imageFile && imageFile.size > 0 ? imageFile : null,
        imageUrl,
        make,
        model,
        year,
        condition,
        transactionType,
        availability,
        operatingHours,
        engineHp,
        locationCountry,
        locationCity,
        sellerVerification,
        inspection,
        warranty,
        delivery,
        inspectionReportUrl,
        specifications,
        featured,
      });

      return c.json(result, 201);
    } catch (error) {
      console.error("Error creating product:", error);
      return c.json(
        {
          error: error instanceof Error ? error.message : "Failed to create product",
        },
        error instanceof Error && error.message.includes("not found") ? 404 : 500
      );
    }
  }

  static async updateProduct(c: Context) {
    try {
      const productId = c.req.param("id");
      const formData = await c.req.formData();
      const updateData: any = {};

      const stringFields = [
        "name", "price", "description", "categoryId", "imageUrl",
        "make", "model", "condition", "transactionType", "availability",
        "locationCountry", "locationCity", "sellerVerification",
        "inspection", "warranty", "delivery", "inspectionReportUrl",
        "specifications", "status"
      ];

      for (const field of stringFields) {
        const val = formData.get(field);
        if (val !== null && val !== undefined) {
          updateData[field] = val as string;
        }
      }

      if (formData.get("year")) updateData.year = Number(formData.get("year"));
      if (formData.get("operatingHours")) updateData.operatingHours = Number(formData.get("operatingHours"));
      if (formData.get("engineHp")) updateData.engineHp = Number(formData.get("engineHp"));
      if (formData.get("featured") !== null) updateData.featured = formData.get("featured") === "true";

      const imageFile = formData.get("image") as File | null;
      if (imageFile && imageFile.size > 0) {
        updateData.imageFile = imageFile;
      }

      if (Object.keys(updateData).length === 0) {
        return c.json({ error: "No fields to update" }, 400);
      }

      const result = await productService.updateProduct(productId, updateData);
      return c.json(result, 200);
    } catch (error) {
      console.error("Error updating product:", error);
      return c.json(
        {
          error: error instanceof Error ? error.message : "Failed to update product",
        },
        error instanceof Error && error.message.includes("not found") ? 404 : 500
      );
    }
  }

  static async deleteProducts(c: Context) {
    try {
      const { productIds } = await c.req.json();

      if (!Array.isArray(productIds) || productIds.length === 0) {
        return c.json(
          { error: "productIds must be a non-empty array" },
          400
        );
      }

      const result = await productService.deleteProducts(productIds);
      return c.json(result, 200);
    } catch (error) {
      console.error("Error deleting products:", error);
      return c.json(
        {
          error: error instanceof Error ? error.message : "Failed to delete products",
        },
        500
      );
    }
  }

  static async getAllProducts(c: Context) {
    try {
      const products = await productService.getAllProducts();
      return c.json({ data: products }, 200);
    } catch (error) {
      console.error("Error getting products:", error);
      return c.json(
        {
          error: error instanceof Error ? error.message : "Failed to get products",
        },
        500
      );
    }
  }

  static async getProduct(c: Context) {
    try {
      const productId = c.req.param("id");
      const product = await productService.getProduct(productId);
      return c.json(product, 200);
    } catch (error) {
      console.error("Error getting product:", error);
      return c.json(
        {
          error: error instanceof Error ? error.message : "Failed to get product",
        },
        error instanceof Error && error.message.includes("not found") ? 404 : 500
      );
    }
  }

  static async getProductImage(c: Context) {
    try {
      const filename = c.req.param("filename");
      const imageBuffer = await productService.getProductImage(filename);
      return c.body(imageBuffer, 200, {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000",
      });
    } catch (error) {
      console.error("Error getting product image:", error);
      return c.json({ error: "Image not found" }, 404);
    }
  }

  static async getProductStats(c: Context) {
    try {
      const stats = await productService.getProductStats();
      return c.json(stats, 200);
    } catch (error) {
      console.error("Error getting product stats:", error);
      return c.json(
        {
          error: error instanceof Error ? error.message : "Failed to get product stats",
        },
        500
      );
    }
  }
}
