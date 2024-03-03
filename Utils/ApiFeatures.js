// AULA 81 - CREATING A REUSABLE FEATURES CLASS
class ApiFeatures {
    constructor (query, queryStr) {
        this.query = query
        this.queryStr = queryStr
    }

    filter () {
        let queryString = JSON.stringify(this.queryStr)

        queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
        const queryObj = JSON.parse(queryString)

        let {sort, fields, page, limit, ...queryObjOnlyDocProperties} = queryObj
        this.query = this.query.find(queryObjOnlyDocProperties)

        return this
    }

    sort () {
        if (this.queryStr.sort) {
            this.query = this.query.sort(this.queryStr.sort.replace(/(,)/g, ' '))
        } else {
            this.query = this.query.sort('-name')    
        }

        return this
    }

    fields () {
        if (this.queryStr.fields) {
            this.query = this.query.select(this.queryStr.fields.replace(/(,)/g, ' '))
        } else {
            this.query = this.query.select('-__v')
        }

        return this
    }

    paginate () {
        const pagina = +this.queryStr.page || 1
        const limite = +this.queryStr.limit || 10
        const skip = (pagina - 1) * limite
  
        this.query = this.query.skip(skip).limit(limite)

        /* if (this.queryStr.page) {
            if(skip >= await Movie.countDocuments()) {
                throw new Error('Page not found')
            }
        } */

        return this
    }
}

module.exports = ApiFeatures