# AI/ML Internship – Zynvex Solutions

Hello everyone! I am **Numair Fahad**, a BSCS undergraduate at the **National University of Technology (NUTECH), Islamabad**, currently working as an **AI/ML Intern at Zynvex Solutions**. This repository contains all my assignments, projects, and learning activities completed during the AI/ML Internship Program at Zynvex Solutions. I look forward to strengthening my Python, Machine Learning, and Deep Learning skills while building practical AI solutions throughout this internship.

---

## 🚀 Capstone Project — LearnTube

> **AI YouTube Learning Assistant** | Full-stack RAG application + Native Mobile App

🌐 **Live App:** [ai-you-tube-assistant.replit.app](https://ai-you-tube-assistant.replit.app)
📁 **Project Folder:** [`ai_youtube_learning_assistant/`](./ai_youtube_learning_assistant/)
📄 **Project Report:** [`LearnTube_Project_Report.pdf`](./LearnTube_Project_Report.pdf)

LearnTube transforms any YouTube video into an interactive learning experience — paste a URL and instantly get an AI-generated summary, quiz, flashcards, and a context-aware chat assistant grounded in the video transcript. Available on web and as a native iOS/Android app.

| Stack | Technology |
|-------|-----------|
| Backend | FastAPI (Python 3.13), Google Gemini 2.0 Flash, ChromaDB, sentence-transformers |
| Web Frontend | React 18, Vite 6, Tailwind CSS v4, Clerk Auth |
| Mobile App | Expo 53, React Native 0.79, Clerk Auth |
| Deployment | Autoscale (Replit), live at `ai-you-tube-assistant.replit.app` |

---

## 📂 Labs & Assignments

| Lab / Assignment | Topic                                      | Status       | Key Files |
|------------------|--------------------------------------------|--------------|-----------|
| Lab 2            | NumPy & Pandas Basics                      | Completed    | `Lab2_NumairFahad.ipynb` |
| Lab 3            | Data Cleaning & Preprocessing              | Completed    | `Lab3_NumairFahad.ipynb`, `employee_records_clean.csv` |
| Lab 4            | Data Visualization with Matplotlib & Seaborn | Completed  | `Lab4_NumairFahad.ipynb`, `titanic.csv` |
| Assignment 01    | Comprehensive EDA on NYC Airbnb Listings   | Completed    | `Assignment01_Airbnb_EDA.ipynb`, `new_york_airbnb_cleaned.csv` |
| Lab 6            | Train-Test Split & Feature Scaling         | Completed    | `Lab 06_NumairFahad.ipynb` |
| Lab 7            | Regression Models                          | Completed    | `Lab 07_NumairFahad.ipynb` |
| Lab 8            | Classification Models                      | Completed    | `Lab 08_NumairFahad.ipynb` |
| Lab 9            | Model Evaluation & Metrics                 | Completed    | `Lab 09_NumairFahad.ipynb` |
| Lab 10           | Feature Engineering                        | Completed    | `Lab 10_NumairFahad.ipynb`, `tips.csv` |
| Assignment 02    | Insurance Cost Prediction – End-to-End Regression Project | Completed | `Assignment2_NumairFahad.ipynb`, `insurance_model.joblib` |
| Lab 11           | Neural Network Fundamentals                | Completed    | `Lab 11_NumairFahad.ipynb`, `wine.csv` |
| Lab 13           | Convolutional Neural Networks (CNNs)       | Completed    | `Lab 13_NumairFahad.ipynb`, `fashion_mnist_data/` |
| Lab 14           | Recurrent Neural Networks (SimpleRNN/LSTM/GRU) | Completed | `Lab 14_NumairFahad.ipynb`, `imdb_data/` |
| Assignment 03    | Customer Churn Prediction (Deep Learning)  | Completed    | `Assignment3_NumairFahad.ipynb`, `churn_model.keras`, `WA_Fn-UseC_-Telco-Customer-Churn.csv` |
| **Capstone**     | **LearnTube — AI YouTube Learning Assistant** | **Completed** | [`ai_youtube_learning_assistant/`](./ai_youtube_learning_assistant/) |

> More labs and assignments will be added as the internship progresses.

---

## 🛠️ Technologies & Tools

- **Programming Language**: Python, TypeScript
- **ML/AI Libraries**: NumPy, Pandas, Matplotlib, Seaborn, Scikit-learn, TensorFlow/Keras, sentence-transformers, ChromaDB, google-genai (Gemini)
- **Web**: React 18, Vite 6, Tailwind CSS v4, FastAPI, SQLAlchemy
- **Mobile**: Expo 53, React Native 0.79
- **Auth**: Clerk (JWT + Google OAuth)
- **Environment**: Google Colab, Jupyter Notebook, VS Code, Replit
- **Version Control**: Git & GitHub

---

## 📊 Datasets Used

### Lab 03 - Employee Records Dataset

- **`employee_records_clean.csv`** — A cleaned version of the messy employee dataset after performing:
  - Inspection of the dataset.
  - Handling missing values (`Age` with median, `Salary` with mean).
  - Removing duplicate rows.
  - Standardizing inconsistent text (employee names and department names).
  - Splitting `Department_Region` into two independent `Department` and `Region` columns.
  - Fixing incorrect data types (especially the `Phone` column).
  - Detecting and handling outliers using the IQR method.

### Labs 04 & 09 - Titanic Dataset

- **`titanic.csv`** — The classic Titanic passenger dataset used for data visualization and exploratory analysis. The following tasks were performed on this dataset:

  - Inspected the dataset structure using `df.info()` and `df.describe()`.
  - Separated numeric and categorical columns using `select_dtypes()`.
  - Created a **histogram** to visualize the distribution of passenger ages.
  - Created a **bar chart** to show the number of passengers in each class.
  - Created a **box plot** to compare fare distribution across passenger classes.
  - Created a **correlation heatmap** to explore relationships between distinct numerical variables.
  - Built a **scatter plot** of Age vs Fare colored by survival status.
  - Analyzed survival rates by grouping data on `Pclass` and `Sex`.
  - Trained classification models (Logistic Regression, KNN, Decision Tree).
  - Evaluated models using **Confusion Matrix**, **Precision**, **Recall**, **F1-Score**, **ROC-AUC**, and **Cross-Validation**.
  - Analyzed the effect of changing the decision threshold on precision and recall.

### Assignment 01 - NYC Airbnb Dataset

- **`new_york_airbnb_cleaned.csv`** — Cleaned version of the New York City Airbnb listings dataset.  
  Work performed includes:
  - Handling missing values
  - Removing outliers in `price` and `minimum_nights`
  - Feature engineering (`price_category`)
  - Univariate, bivariate, and multivariate analysis
  - Key insights and actionable recommendation

### Labs 06 & 08 - Iris Dataset

- Used the classic Iris dataset from scikit-learn to practice:
  - Train-Test Split (~75%-25%)
  - Feature Scaling with `StandardScaler`
  - Verifying scaled data (mean ≈ 0, std ≈ 1)
  - Understanding the proper ML workflow (`.fit_transform()` on train, `.transform()` on test)
  - Classification models: Logistic Regression, K-Nearest Neighbors (KNN), Decision Tree
  - Model comparison, hyperparameter tuning, and tree visualization

### Lab 07 - California Housing Dataset

- Built and evaluated regression models:
  - Simple Linear Regression
  - Multiple Linear Regression
  - Polynomial Regression
  - Model evaluation using MSE, RMSE and R² Score
  - Feature coefficient analysis

### Lab 10 - Tips Dataset

- Feature engineering practice on restaurant bill data
- Encoding categorical variables (sex, smoker, day, time)
- Creating derived features (`bill_per_person`, `tip_percentage`, `is_weekend`)
- Binning continuous variables
- Feature scaling and correlation-based feature selection

### Assignment 02 - Insurance Cost Prediction Dataset

- `insurance_model.joblib` — A trained and saved regression model built on the Medical Insurance Cost dataset. Work performed includes:
  - Data loading, exploration, and skewness analysis of the target variable (`charges`)
  - Feature engineering: encoding categorical columns, creating `bmi_category` and `smoker_age_interaction`, log-transforming the target, and scaling numeric features
  - Built and compared three regression models: Simple Linear Regression, Multiple Linear Regression, and Polynomial Regression
  - Model evaluation using R² Score, MAE, MSE, RMSE, and 5-fold cross-validation
  - Model selection, coefficient interpretation, and lightweight deployment via a `predict_insurance_cost()` function

### Lab 11 - Wine Dataset

- Neural network fundamentals from scratch using NumPy
- Manual implementation of a single neuron, forward pass, activation functions (ReLU, Sigmoid, Tanh)
- Loss calculation (MSE & Binary Cross-Entropy)
- Gradient descent steps and loss visualization

### Lab 13 - Fashion-MNIST Dataset (CNN)

- `fashion_mnist_data/` — Fashion-MNIST training and test images saved as `.npy` files for offline use
- Built Convolutional Neural Networks (CNNs) using Conv2D, MaxPooling2D, and Dropout layers
- Compared CNN architectures by varying depth (number of conv blocks) and filter counts
- Analyzed the effect of dropout rate on training/validation accuracy gap and overfitting
- Evaluated per-class performance using `sklearn.metrics.classification_report`
- Visualized misclassified images and training/validation loss & accuracy curves
- Compared CNN's convolution and pooling approach to the Dense network from Lab 12

## Lab 14 - IMDB Movie Reviews Dataset

- `imdb_data/` — IMDB movie review sequences (padded) saved as `.npz` for offline use
- Built Recurrent Neural Networks for binary sentiment classification (positive/negative) using Embedding, SimpleRNN, GRU, and LSTM layers
- Compared SimpleRNN, GRU, and LSTM architectures on test accuracy and training time
- Experimented with sequence length (`maxlen`) trade-offs between training time and accuracy
- Built a custom stacked-LSTM architecture and trained on the full IMDB training set
- Performed error analysis on misclassified reviews, decoding text back to words to inspect model failures
- Predicted sentiment on a custom, hand-written review by encoding it into the model's word-index format
- Compared RNN's sequential, order-dependent processing approach to the CNN's spatial approach from Lab 13
  
### Assignment 03 - Telco Customer Churn Dataset

- End-to-end deep learning project for customer churn prediction
- Data cleaning, encoding, scaling, and handling class imbalance
- Baseline Keras neural network and model tuning using Dropout and Early Stopping
- Proper model evaluation using Precision, Recall, F1-Score, and Confusion Matrix
- Saved and reused the trained model for predictions

---

## 🚀 How to Use

1. Clone this repository:
   ```bash
   git clone https://github.com/numair-2003/AIML-Internship-NumairFahad.git
   ```
2. Open any `.ipynb` file in Jupyter Notebook, Google Colab, or VS Code.
3. For the LearnTube capstone project, see [`ai_youtube_learning_assistant/README.md`](./ai_youtube_learning_assistant/README.md).

---

## 👨‍💻 Author

- **Name:** Numair Fahad
- **Role:** AI/ML Intern
- **Company:** Zynvex Solutions
- **GitHub:** [numair-2003](https://github.com/numair-2003)
