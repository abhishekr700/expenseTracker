const router = require("express").Router();
const { Op, Sequelize } = require("sequelize");

const {
    expenseTypes,
    expenseEntries,
    expenseEntryToTypeMap,
    tags,
    sequelize
} = require("../models");

const ErrorMessages = {
    typeIdNotFound: "The typeId does not correspond to a valid Expense Type"
};

const checkTypeExists = async (typeId) => {
    const typeData = await expenseTypes.findOne({
        where: {
            id: typeId
        }
    });
    if (typeData == null) return false;
    return true;
};

const getTypeData = async (typeId) => {
    const typeData = await expenseTypes.findOne({
        where: {
            id: typeId
        }
    });
    if (typeData == null) throw new Error(ErrorMessages.typeIdNotFound);
    return typeData;
};

const insertExpenseEntry = async (
    name,
    amount,
    date,
    typeId,
    splitwiseExpenseId,
    upiReferenceNum,
    externalUniqueId,
    expenseTags = []) => {
    console.log("insertExpenseEntry:", {
        name,
        amount,
        date,
        typeId,
        splitwiseExpenseId,
        upiReferenceNum,
        externalUniqueId,
        expenseTags
    });
    try {
        const result = await sequelize.transaction(async (t) => {
            const createRes = await expenseEntries.create({
                name,
                amount,
                date,
                splitwiseExpenseId,
                upiReferenceNum,
                externalUniqueId,
            }, { transaction: t, });
            const typeData = await getTypeData(typeId);
            const createRes2 = await expenseEntryToTypeMap.create({
                ExpenseEntryId: createRes.id,
                ExpenseTypeId: typeData.id
            }, { transaction: t, });

            console.log("Bulk inserting/updating tags");
            const tagUpsertRes = await Promise.all(
                expenseTags.map(name =>
                    tags.findOrCreate({
                        where: { name },
                        transaction: t
                    }) // Ensures uniqueness
                )
            );

            const tagInstances = tagUpsertRes.map(res => res[0]);

            console.log("Attaching tags to expenses");
            await Promise.all(
                tagInstances.map(tagInstance =>
                    createRes.addTag(tagInstance, { transaction: t, })
                )
            );

            return { createRes, createRes2, tagInstances };
        });
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

const getExpenseForMonth = async (month, year, category) => {
    console.log("getExpenseForMonth:", month, year, category);
    const expenseTypeWhereClause = {

    };
    if (category instanceof Array) {
        expenseTypeWhereClause["id"] = {
            [Op.in]: category
        };
    }
    console.log({ expenseTypeWhereClause });

    const data = await expenseEntries.findAll({
        where: {
            [Op.and]: [
                Sequelize.where(
                    Sequelize.fn('MONTH', Sequelize.col('date')),
                    month
                ),
                Sequelize.where(
                    Sequelize.fn('YEAR', Sequelize.col('date')),
                    year
                ),
            ],
        },
        order: [['date', 'DESC'], ['createdAt', 'ASC']],
        include: [
            {
                model: expenseTypes,
                where: expenseTypeWhereClause
            },
            tags
        ]
    });
    console.log("getExpenseForMonth:", data.length);
    return data;
};

const processExpenseList = async (expenses) => {
    let total = 0;
    for (const expense of expenses) {
        total += expense.amount;
        console.log({ total, amt: expense.amount });
    }
    total = total.toFixed(2);

    return {
        expenseEntries: expenses,
        total
    };
};

router.get("/expense/types", async (req, res) => {
    const data = await expenseTypes.findAll({
        attributes: ['id', 'name']
    });
    console.log(data);
    res.send(data);
});

// Add a new expense type
router.post("/expense/types", async (req, res) => {
    const { typeName, parentType } = req.body;
    if (typeName == undefined) {
        return res.status(400).send("typeName cannot be undefined");
    }
    // Find parent Id
    let parentId;
    if (parentType != undefined) {
        const parent = await expenseTypes.findOne({
            where: { name: parentType }
        });
        console.log(parent);
        if (parent == null) {
            return res.status(400).send("Parent Type was not found");
        }
        parentId = parent.id;
    }
    // Check if this TypeName already exists
    const existingType = await expenseTypes.findOne({
        where: { name: typeName }
    });
    if (existingType != null) {
        console.log("TypeName found:", existingType);
        return res.status(400).send("The typeName already exists");
    }

    const createRes = await expenseTypes.create({
        name: typeName,
        parent: parentId
    });
    res.send(createRes);
});

// Add a new expense
router.post("/expenseEntry", async (req, res, next) => {
    console.log("/expenseEntry", req.body);
    const {
        name,
        amount,
        date,
        typeId,
        splitwiseExpenseId,
        upiReferenceNum,
        externalUniqueId,
        tags } = req.body;
    try {
        if (!name || !amount || !date || !typeId) {
            return res.status(400).send("Input Invalid");
        }
        // Check for type
        if (!checkTypeExists(typeId)) {
            return res.status(400).send(ErrorMessages.typeIdNotFound);
        }
        // Insert Entry
        const insertRes = await insertExpenseEntry(
            name,
            amount,
            date,
            typeId,
            splitwiseExpenseId,
            upiReferenceNum,
            externalUniqueId,
            tags
        );
        console.log({ insertRes });
        return res.send(insertRes);
    } catch (e) {
        next(e);
    }
});

router.patch("/expenseEntry", async (req, res) => {
    console.log("PATCH /expenseEntry", req.body);
    const { name, amount, date, typeId, expenseId } = req.body;
    if (!expenseId) {
        return res.status(400).send("Input Invalid. Must have expenseId");
    }
    // TODO: make this a transaction

    const expense = await expenseEntries.findByPk(expenseId);

    if (name) {
        expense.name = name;
    }
    if (amount) {
        expense.amount = amount;
    }
    if (date) {
        expense.date = date;
    }
    console.log(expense);
    await expense.save();

    const expenseEntry = await expenseEntryToTypeMap.findOne({
        where: {
            ExpenseEntryId: expenseId
        }
    });
    expenseEntry.ExpenseTypeId = typeId;
    await expenseEntry.save();

    // Retrieve the updated expense with corresponding expenseType
    const updatedExpense = await expenseEntries.findByPk(expenseId, {
        include: expenseTypes
    });
    console.log(updatedExpense);

    return res.send(updatedExpense);
});

router.get("/checkExpenseExistsBySplitwiseId", async (req, res) => {
    const { splitwiseExpenseId } = req.query;
    console.log("checkExpenseExistsBySplitwiseId: ", req.query);


    const expense = await expenseEntries.findOne({
        where: {
            splitwiseExpenseId: splitwiseExpenseId
        }
    });

    res.send({
        exists: expense !== null
    });
});

// Check if a expense entry exists with the given UPI Reference Number
router.get("/checkExpenseExistsByUpiReferenceNum", async (req, res) => {
    const { upiReferenceNum } = req.query;
    console.log("checkExpenseExistsByUpiReferenceNum: ", req.query);

    if (upiReferenceNum === undefined) {
        return res.status(400).send("upiReferenceNum is undefined");
    }

    const expense = await expenseEntries.findOne({
        where: {
            upiReferenceNum: upiReferenceNum
        }
    });

    res.send({
        exists: expense !== null
    });
});

// Check if a expense entry exists with the given externalUniqueId
router.get("/checkExpenseExistsByExternalUniqueId", async (req, res) => {
    const { uniqueId } = req.query;
    console.log("checkExpenseExistsByUpiReferenceNum: ", req.query);

    if (uniqueId === undefined) {
        return res.status(400).send("uniqueId is undefined");
    }

    const expense = await expenseEntries.findOne({
        where: {
            externalUniqueId: uniqueId
        }
    });

    res.send({
        exists: expense !== null
    });
});

// Get list of expenses for a Month,Year
router.get("/expenseMonthly", async (req, res) => {
    const { month, year, expenseTypes } = req.query;
    let expenseTypesArr;
    if (expenseTypes) {
        expenseTypesArr = expenseTypes.split(",");
    }
    const data = await getExpenseForMonth(month, year, expenseTypesArr);
    const processedData = await processExpenseList(data);
    res.send(processedData);
});

module.exports = router;
