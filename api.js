import axios from "axios";
import 'dotenv/config';

const BASE_URL = "https://kitchenly-backend.onrender.com";


/** API Class.
 * 
 * Static class tying together methods used to get/send to the API.
 * There shouldn't be any frontend-specific stuff here, 
 * and there shouldn't be any API-aware stuff elsewhere in the frontend.
 * 
*/

class KitchenlyApi {
    // the token for interacting with the API will be stored here
    static token;

    static async request(endpoint, data = {}, method = "get") {
        console.debug("API Call", endpoint, data, method);

        const url = `${BASE_URL}/${endpoint}`;
        const headers = { Authorization: `Bearer ${KitchenlyApi.token}` };
        const params = (method === "get")
            ? data
            : {};
        
        try {
            return (await axios({ url, method, data, params, headers })).data;
        } catch (err) {
            console.error("API Error:", err);
            let message = err.response.data.error.message;
            throw Array.isArray(message) ? message : [message];
        };
    };

    /** API methods */

    /************** Auth routes *************** */


    /** Sets kitchenly token to users token. 
     * Used to authenticate further requests.
    **/
    static setToken(token) {
        KitchenlyApi.token = token;
    };

    /** Gets token from kitchenly api */
    static getToken() {
        return KitchenlyApi.token;
    };

    /** Gets token from user with { username, password } */
    static async getToken(user) {
        let res = await this.request(`auth/token`, user, "post");
        return res.token;
    };

    /******************* User routes ****************************************/

    /** Registers user to database with { username, password, first_name, last_name, email } => { token } */
    static async registerUser(user) {
        let res = await this.request(`auth/register`, user, "post");
        return res.token;
    };

    /** Get details on user in database by username 
     * 
     * - Authorization required: admin or same-user
    **/
    static async getUser(username) {
        let res = await this.request(`users/${username}`);
        return res.user;
    };

    /** Update data on user
     * data => { first_name, last_name, password, email } => { user }
     * 
     * - Authorization required: admin or same-user
    **/
    static async patchUser(username, user) {
        let res = await this.request(`users/${username}`, user, "patch");
        return res.user;
    };

    /** Delete user
     * 
     * - Authorization required: admin or same-user
    **/
    static async deleteUser(username) {
        let res = await this.request(`users/${username}`, {}, "delete");
        return res;
    };

    /** Save Recipe to user
     * 
     * - Authorization required: admin or same-user
    **/
    static async saveRecipe(username, recipe_id) {
        let res = await this.request(`users/${username}/recipe/${recipe_id}`, {}, "post");
        console.debug(res);
        return res;
    }

    /** unsave Recipe to user 
     * 
     * - Authorization required: admin or same-user
    **/
    static async unsaveRecipe(username, recipe_id) {
        let res = await this.request(`users/${username}/recipe/${recipe_id}`, {}, "delete");
        console.debug(res);
        return res;
    }

    /******************* Recipe routes ****************************************/


    /** Creates a recipe with username 
     * 
     * **Authorization required:**
     *  - Admin
     *  - Same-user
     * 
    */
    static async createRecipe(username, recipe) {
        const recipeIngredients = recipe.ingredients || [];
        const recipeTags = recipe.tags || [];

        const ingredients = [];
        const tags = [];

        // await ingredients.map(async i => await this.createIngredient(i));
        // await tags.map(async t => await this.createTag(t));

        if(recipeIngredients.length > 0){
            for(const i of recipeIngredients) {
                const result = await this.createIngredient(i);
                ingredients.push(result.id);
            }
        }
        if(recipeTags.length > 0){
            for(const t of recipeTags) {
                const result = await this.createTag(t);
                tags.push(result.id);
            }
        }

        console.debug(ingredients);
        console.debug(tags);
        console.debug(recipe);
        recipe.ingredients = ingredients;
        recipe.tags = tags;
        let res = await this.request(`recipes/${username}`, recipe, "post")
        return res.recipe;
    };

    /** Gets recipes with recipe_id */
    static async getRecipe(recipe_id) {
        let res = await this.request(`recipes/search/${recipe_id}`);
        return res.recipe;
    };

    /** Gets all recipes 
     * 
     * Also can use filter by title
     * 
     * @param {{ title: "" }} query
     * 
     * @returns {{ recipes: [] }} An array of recipes
    */
    static async getRecipes(query) {
        try {
            const res = await this.request(`recipes/`, query);
            return res.recipes;
        } catch (err) {
            return [];
        }
    };

    /** Searches recipes by categories 
     * @param {array} categories - Array of category id(s)
     */
    static async getRecipesByCategory(categories) {
        try {
            const data = { category_ids: categories }
            let res = await this.request(`recipes/filter/categories`, data);
            return res.recipes;
        } catch (err) {
            return [];
        }
    };

    /** Searches recipes by tags 
     * @param {array} tags - Array of tag id(s)
    */
    static async getRecipesByTags(tags) {
        try {
            const data = { tag_ids: tags }
            let res = await this.request(`recipes/filter/tags`, data);
            return res.recipes;
        } catch (err) {
            return [];
        }
    };

    /** Updates recipe with data
     * @param { { title: string, recipe_description: string, preparation_time: int, cooking_time: int, servings: int, ingredients: [], categories: [], tags: []} } data 
     * 
     * **Authorization required:**
     *  - Admin
     *  - same-user
     */
    static async updateRecipe(username, recipe_id, recipe) {
        const recipeIngredients = recipe.ingredients || [];
        const recipeTags = recipe.tags || [];

        const ingredients = [];
        const tags = [];

        // await ingredients.map(async i => await this.createIngredient(i));
        // await tags.map(async t => await this.createTag(t));

        if(recipeIngredients.length > 0){
            for(const i of recipeIngredients) {
                const result = await this.createIngredient(i);
                ingredients.push(result.id);
            }
        }
        if(recipeTags.length > 0){
            for(const t of recipeTags) {
                const result = await this.createTag(t);
                tags.push(result.id);
            }
        }

        console.debug(ingredients);
        console.debug(tags);
        recipe.ingredients = ingredients;
        recipe.tags = tags;
        console.debug(recipe);
        const res = await this.request(`recipes/${username}/${recipe_id}`, recipe, "patch");
        return res.recipe;
    };

    /** Deletes recipe */
    static async deleteRecipe(username, recipe_id) {
        let res = await this.request(`recipes/${username}/${recipe_id}`, {}, "delete");
        return res.result;
    };

    /******************* Tag routes ****************************************/

    /** Creates a tag with tag_name
     * 
     * **Authorization required:**
     * - logged-in
     */
    static async createTag(tag_name) {
        let res = await this.request(`tags/`, {tag_name: tag_name}, "post");
        return res.tag;
    }

    /** Gets all tags */
    static async getTagAll(tag_name="") {
        let res = await this.request(`tags/`, {tag_name});
        return res.tags;
    }

    /** Gets tag with tag id 
     * @param {int} tag_id - Id of tag
    */
    static async getTag(tag_id) {
        let res = await this.request(`tag/${tag_id}`);
        return res.tags;
    }

    /** Update tag with data
     * @param {{tag_name: String}} data - Data can only include tag_name
     * @param {int} tag_id - Tag id to update
     * 
     * @returns {tag : { id: int, tag_name: String } }
     * 
     * **Authorization required:**
     * - Admin
    **/
    static async updateTag(data, tag_id) {
        let res = await this.request(`tag/${tag_id}`, data, "patch");
        return res.tag;
    }

    /** Delete tag from db with tag_id 
     * @param {int} tag_id
     * 
     * **Authorization required:**
     * - Admin
    */
    static async deleteTag(tag_id) {
        let res = await this.request(`tag/${tag_id}`, "delete");
        return res.result;
    }

    /******************* Category routes ****************************************/
    static async getCategories() {
        let res = await this.request(`categories`);
        return res.categories;
    }
    /******************* Ingredient routes **************************************/
    static async createIngredient(name) {
        let res = await this.request(`ingredients`, { ingredient_name: name }, "post");
        return res.ingredient;
    }

    static async getIngredients() {
        let res = await this.request(`ingredients`);
        return res.ingredients;
    }
}

export default KitchenlyApi;
