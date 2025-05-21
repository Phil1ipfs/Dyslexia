// src/pages/Teachers/ManageCategories/TemplatesTab.jsx
import React, { useState, useEffect } from "react";
import { Row, Col, Card, Button, Form, Tabs, Tab, Table, Modal, Badge } from "react-bootstrap";
import { FaPlus, FaEdit, FaTrash, FaEye, FaCheck, FaTimes } from "react-icons/fa";

const TemplatesTab = () => {
  const [templateType, setTemplateType] = useState("question");
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [modalMode, setModalMode] = useState("view"); // view, create, edit
  const [filters, setFilters] = useState({
    category: "All",
    isApproved: "All"
  });
  const [searchTerm, setSearchTerm] = useState("");

  const categories = ["All", "Alphabet Knowledge", "Phonological Awareness", "Decoding", "Word Recognition", "Reading Comprehension"];

  // Mock data
  useEffect(() => {
    // Simulate API call based on template type
    setLoading(true);
    setTimeout(() => {
      let mockTemplates = [];
      
      if (templateType === "question") {
        mockTemplates = [
          {
            id: "6829799079a34741f9cd19ef",
            category: "Alphabet Knowledge",
            questionType: "patinig",
            templateText: "Anong katumbas na maliit na letra?",
            applicableChoiceTypes: ["patinigBigLetter", "patinigSmallLetter"],
            correctChoiceType: "patinigSmallLetter",
            isApproved: true,
            createdAt: "May 1, 2025"
          },
          {
            id: "6829799079a34741f9cd19f0",
            category: "Alphabet Knowledge",
            questionType: "patinig",
            templateText: "Anong katumbas na malaking letra?",
            applicableChoiceTypes: ["patinigBigLetter", "patinigSmallLetter"],
            correctChoiceType: "patinigBigLetter",
            isApproved: true,
            createdAt: "May 1, 2025"
          },
          {
            id: "6829799079a34741f9cd19f5",
            category: "Phonological Awareness",
            questionType: "malapantig",
            templateText: "Kapag pinagsama ang mga pantig, ano ang mabubuo?",
            applicableChoiceTypes: ["malapatinigText", "wordText"],
            correctChoiceType: "wordText",
            isApproved: true,
            createdAt: "May 1, 2025"
          },
          {
            id: "6829799079a34741f9cd19f8",
            category: "Word Recognition",
            questionType: "word",
            templateText: "Piliin ang tamang larawan para sa salitang:",
            applicableChoiceTypes: ["wordText"],
            correctChoiceType: "wordText",
            isApproved: true,
            createdAt: "May 1, 2025"
          },
          {
            id: "6829799079a34741f9cd19fa",
            category: "Decoding",
            questionType: "word",
            templateText: "Paano babaybayin ang salitang ito?",
            applicableChoiceTypes: ["wordText"],
            correctChoiceType: "wordText",
            isApproved: true,
            createdAt: "May 1, 2025"
          }
        ];
      } else if (templateType === "choice") {
        mockTemplates = [
          {
            id: "68297e4979a34741f9cd1a0f",
            choiceType: "patinigBigLetter",
            choiceValue: "A",
            choiceImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/letters/A_big.png",
            soundText: null,
            isActive: true,
            createdAt: "May 1, 2025"
          },
          {
            id: "68297e4979a34741f9cd1a14",
            choiceType: "patinigSmallLetter",
            choiceValue: "a",
            choiceImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/letters/a_small.png",
            soundText: null,
            isActive: true,
            createdAt: "May 1, 2025"
          },
          {
            id: "68297e4979a34741f9cd1a19",
            choiceType: "patinigSound",
            choiceValue: null,
            choiceImage: null,
            soundText: "/ah/",
            isActive: true,
            createdAt: "May 1, 2025"
          },
          {
            id: "68297e4979a34741f9cd1a1e",
            choiceType: "katinigBigLetter",
            choiceValue: "B",
            choiceImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/letters/B_big.png",
            soundText: null,
            isActive: true,
            createdAt: "May 1, 2025"
          },
          {
            id: "6829828a79a34741f9cd1a4b",
            choiceType: "wordText",
            choiceValue: "bola",
            choiceImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/words/ball.png",
            soundText: null,
            isActive: true,
            createdAt: "May 1, 2025"
          }
        ];
      } else if (templateType === "sentence") {
        mockTemplates = [
          {
            id: "68297c4379a34741f9cd1a00",
            title: "Si Maria at ang mga Bulaklak",
            category: "Reading Comprehension",
            readingLevel: "Low Emerging",
            sentenceText: ["Si Maria ay pumunta sa parke...", "Nang makita ng ina ni Maria..."],
            sentenceQuestions: 3,
            isApproved: true,
            createdAt: "May 1, 2025"
          },
          {
            id: "68297c4379a34741f9cd1a01",
            title: "Ang Batang Matulungin",
            category: "Reading Comprehension",
            readingLevel: "Transitioning",
            sentenceText: ["Si Pedro ay isang batang matulungin...", "Pagkatapos maglinis, tinutulungan din niya..."],
            sentenceQuestions: 3,
            isApproved: true,
            createdAt: "May 1, 2025"
          },
          {
            id: "68297c4379a34741f9cd1a02",
            title: "Si Lino at ang Kanyang Alagang Isda",
            category: "Reading Comprehension",
            readingLevel: "Developing",
            sentenceText: ["Si Lino ay may maliit na akwaryum...", "Araw-araw, binibigyan ni Lino ng pagkain..."],
            sentenceQuestions: 3,
            isApproved: true,
            createdAt: "May 1, 2025"
          }
        ];
      }
      
      setTemplates(mockTemplates);
      setFilteredTemplates(mockTemplates);
      setLoading(false);
    }, 1000);
  }, [templateType]);

  // Filter templates
  useEffect(() => {
    let filtered = [...templates];
    
    if (filters.category !== "All" && templateType === "question") {
      filtered = filtered.filter(template => template.category === filters.category);
    }
    
    if (filters.isApproved !== "All" && (templateType === "question" || templateType === "sentence")) {
      const isApproved = filters.isApproved === "Approved";
      filtered = filtered.filter(template => template.isApproved === isApproved);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(template => {
        if (templateType === "question") {
          return template.templateText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 template.category.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (templateType === "choice") {
          return (template.choiceValue && template.choiceValue.toLowerCase().includes(searchTerm.toLowerCase())) ||
                 template.choiceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 (template.soundText && template.soundText.toLowerCase().includes(searchTerm.toLowerCase()));
        } else if (templateType === "sentence") {
          return template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 template.readingLevel.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
    }
    
    setFilteredTemplates(filtered);
  }, [filters, templates, searchTerm, templateType]);

  const handleViewTemplate = (template) => {
    setCurrentTemplate(template);
    setModalMode("view");
    setShowModal(true);
  };

  const handleCreateTemplate = () => {
    setCurrentTemplate(null);
    setModalMode("create");
    setShowModal(true);
  };

  const handleEditTemplate = (template) => {
    setCurrentTemplate(template);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleDeleteTemplate = (id) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      console.log("Delete template:", id);
      // API call to delete
      setTemplates(templates.filter(template => template.id !== id));
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value
    });
  };

  const resetFilters = () => {
    setFilters({
      category: "All",
      isApproved: "All"
    });
    setSearchTerm("");
  };

  // Render Question Templates Table
  const renderQuestionTemplatesTable = () => {
    return (
      <Table responsive hover>
        <thead className="bg-light">
          <tr>
            <th>ID</th>
            <th>Category</th>
            <th>Question Type</th>
            <th>Template Text</th>
            <th>Correct Choice Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map(template => (
              <tr key={template.id}>
                <td>{template.id.substring(template.id.length - 6)}</td>
                <td>{template.category}</td>
                <td>{template.questionType}</td>
                <td>{template.templateText}</td>
                <td>{template.correctChoiceType}</td>
                <td>
                  <Badge bg={template.isApproved ? "success" : "warning"}>
                    {template.isApproved ? "Approved" : "Pending"}
                  </Badge>
                </td>
                <td>
                  <Button
                    variant="link"
                    className="action-button view"
                    onClick={() => handleViewTemplate(template)}
                  >
                    <FaEye />
                  </Button>
                  <Button
                    variant="link"
                    className="action-button edit"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    variant="link"
                    className="action-button delete"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center py-4">
                No question templates found matching your filters
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    );
  };

  // Render Choice Templates Table
  const renderChoiceTemplatesTable = () => {
    return (
      <Table responsive hover>
        <thead className="bg-light">
          <tr>
            <th>ID</th>
            <th>Choice Type</th>
            <th>Value</th>
            <th>Has Image</th>
            <th>Sound Text</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map(template => (
              <tr key={template.id}>
                <td>{template.id.substring(template.id.length - 6)}</td>
                <td>{template.choiceType}</td>
                <td>{template.choiceValue || "-"}</td>
                <td>
                  {template.choiceImage ? (
                    <Badge bg="success">Yes</Badge>
                  ) : (
                    <Badge bg="secondary">No</Badge>
                  )}
                </td>
                <td>{template.soundText || "-"}</td>
                <td>
                  <Badge bg={template.isActive ? "success" : "secondary"}>
                    {template.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td>
                  <Button
                    variant="link"
                    className="action-button view"
                    onClick={() => handleViewTemplate(template)}
                  >
                    <FaEye />

                    </Button>
                  <Button
                    variant="link"
                    className="action-button edit"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    variant="link"
                    className="action-button delete"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center py-4">
                No choice templates found matching your filters
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    );
  };

  // Render Sentence Templates Table
  const renderSentenceTemplatesTable = () => {
    return (
      <Table responsive hover>
        <thead className="bg-light">
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Category</th>
            <th>Reading Level</th>
            <th>Pages</th>
            <th>Questions</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map(template => (
              <tr key={template.id}>
                <td>{template.id.substring(template.id.length - 6)}</td>
                <td>{template.title}</td>
                <td>{template.category}</td>
                <td>{template.readingLevel}</td>
                <td>{template.sentenceText?.length || 0}</td>
                <td>{template.sentenceQuestions}</td>
                <td>
                  <Badge bg={template.isApproved ? "success" : "warning"}>
                    {template.isApproved ? "Approved" : "Pending"}
                  </Badge>
                </td>
                <td>
                  <Button
                    variant="link"
                    className="action-button view"
                    onClick={() => handleViewTemplate(template)}
                  >
                    <FaEye />
                  </Button>
                  <Button
                    variant="link"
                    className="action-button edit"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    variant="link"
                    className="action-button delete"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center py-4">
                No sentence templates found matching your filters
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    );
  };

  // Template Modal Content
  const renderModalContent = () => {
    if (modalMode === "view" && currentTemplate) {
      if (templateType === "question") {
        return (
          <div>
            <h5>Question Template Details</h5>
            <Row className="mb-3">
              <Col md={6}>
                <p><strong>Category:</strong> {currentTemplate.category}</p>
                <p><strong>Question Type:</strong> {currentTemplate.questionType}</p>
                <p><strong>Template Text:</strong> {currentTemplate.templateText}</p>
              </Col>
              <Col md={6}>
                <p><strong>Correct Choice Type:</strong> {currentTemplate.correctChoiceType}</p>
                <p><strong>Status:</strong> {currentTemplate.isApproved ? "Approved" : "Pending"}</p>
                <p><strong>Created On:</strong> {currentTemplate.createdAt}</p>
              </Col>
            </Row>
            
            <h6 className="mt-3">Applicable Choice Types:</h6>
            <ul className="list-unstyled">
              {currentTemplate.applicableChoiceTypes.map((type, index) => (
                <li key={index} className="mb-1">
                  <Badge bg="info" className="me-2">{type}</Badge>
                </li>
              ))}
            </ul>
          </div>
        );
      } else if (templateType === "choice") {
        return (
          <div>
            <h5>Choice Template Details</h5>
            <Row className="mb-3">
              <Col md={6}>
                <p><strong>Choice Type:</strong> {currentTemplate.choiceType}</p>
                <p><strong>Choice Value:</strong> {currentTemplate.choiceValue || "None"}</p>
                <p><strong>Sound Text:</strong> {currentTemplate.soundText || "None"}</p>
              </Col>
              <Col md={6}>
                <p><strong>Has Image:</strong> {currentTemplate.choiceImage ? "Yes" : "No"}</p>
                <p><strong>Status:</strong> {currentTemplate.isActive ? "Active" : "Inactive"}</p>
                <p><strong>Created On:</strong> {currentTemplate.createdAt}</p>
              </Col>
            </Row>
            
            {currentTemplate.choiceImage && (
              <div className="mt-3">
                <h6>Image Preview:</h6>
                <div className="border p-3 text-center">
                  <img 
                    src={currentTemplate.choiceImage} 
                    alt={currentTemplate.choiceValue || "Choice"} 
                    style={{ maxHeight: "100px" }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      } else if (templateType === "sentence") {
        return (
          <div>
            <h5>Sentence Template Details</h5>
            <Row className="mb-3">
              <Col md={6}>
                <p><strong>Title:</strong> {currentTemplate.title}</p>
                <p><strong>Category:</strong> {currentTemplate.category}</p>
                <p><strong>Reading Level:</strong> {currentTemplate.readingLevel}</p>
              </Col>
              <Col md={6}>
                <p><strong>Pages:</strong> {currentTemplate.sentenceText.length}</p>
                <p><strong>Questions:</strong> {currentTemplate.sentenceQuestions}</p>
                <p><strong>Created On:</strong> {currentTemplate.createdAt}</p>
              </Col>
            </Row>
            
            <h6 className="mt-3">Passage Text:</h6>
            {currentTemplate.sentenceText.map((text, index) => (
              <div key={index} className="bg-light p-3 mb-2 rounded">
                <p className="mb-0"><strong>Page {index + 1}:</strong> {text}</p>
              </div>
            ))}
          </div>
        );
      }
    } else if (modalMode === "create" || modalMode === "edit") {
      // This would be expanded with proper form fields for create/edit
      return (
        <div>
          <h5>{modalMode === "create" ? "Create New" : "Edit"} {templateType.charAt(0).toUpperCase() + templateType.slice(1)} Template</h5>
          <Form>
            {templateType === "question" && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select defaultValue={currentTemplate?.category || ""}>
                    <option value="">Select Category</option>
                    {categories.filter(cat => cat !== "All").map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Question Type</Form.Label>
                  <Form.Select defaultValue={currentTemplate?.questionType || ""}>
                    <option value="">Select Question Type</option>
                    <option value="patinig">Patinig</option>
                    <option value="katinig">Katinig</option>
                    <option value="malapantig">Malapantig</option>
                    <option value="word">Word</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Template Text</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2} 
                    defaultValue={currentTemplate?.templateText || ""}
                    placeholder="Enter the question template text"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Correct Choice Type</Form.Label>
                  <Form.Select defaultValue={currentTemplate?.correctChoiceType || ""}>
                    <option value="">Select Correct Choice Type</option>
                    <option value="patinigBigLetter">patinigBigLetter</option>
                    <option value="patinigSmallLetter">patinigSmallLetter</option>
                    <option value="patinigSound">patinigSound</option>
                    <option value="katinigBigLetter">katinigBigLetter</option>
                    <option value="katinigSmallLetter">katinigSmallLetter</option>
                    <option value="katinigSound">katinigSound</option>
                    <option value="malapatinigText">malapatinigText</option>
                    <option value="wordText">wordText</option>
                    <option value="wordSound">wordSound</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Applicable Choice Types</Form.Label>
                  <div>
                    {["patinigBigLetter", "patinigSmallLetter", "patinigSound", 
                      "katinigBigLetter", "katinigSmallLetter", "katinigSound", 
                      "malapatinigText", "wordText", "wordSound"].map(type => (
                      <Form.Check
                        key={type}
                        type="checkbox"
                        id={`choice-type-${type}`}
                        label={type}
                        defaultChecked={currentTemplate?.applicableChoiceTypes?.includes(type) || false}
                        className="mb-1"
                      />
                    ))}
                  </div>
                </Form.Group>
              </>
            )}
            
            {templateType === "choice" && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Choice Type</Form.Label>
                  <Form.Select defaultValue={currentTemplate?.choiceType || ""}>
                    <option value="">Select Choice Type</option>
                    <option value="patinigBigLetter">patinigBigLetter</option>
                    <option value="patinigSmallLetter">patinigSmallLetter</option>
                    <option value="patinigSound">patinigSound</option>
                    <option value="katinigBigLetter">katinigBigLetter</option>
                    <option value="katinigSmallLetter">katinigSmallLetter</option>
                    <option value="katinigSound">katinigSound</option>
                    <option value="malapatinigText">malapatinigText</option>
                    <option value="wordText">wordText</option>
                    <option value="wordSound">wordSound</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Choice Value</Form.Label>
                  <Form.Control 
                    type="text" 
                    defaultValue={currentTemplate?.choiceValue || ""}
                    placeholder="Enter the choice value"
                  />
                  <Form.Text className="text-muted">
                    Leave blank if this is a sound-only choice
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Sound Text</Form.Label>
                  <Form.Control 
                    type="text" 
                    defaultValue={currentTemplate?.soundText || ""}
                    placeholder="Enter the sound text (if applicable)"
                  />
                  <Form.Text className="text-muted">
                    For sound choices (e.g., /ah/, /buh/)
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Choice Image</Form.Label>
                  <Form.Control type="file" />
                  {currentTemplate?.choiceImage && (
                    <div className="mt-2">
                      <p className="mb-1">Current Image:</p>
                      <img 
                        src={currentTemplate.choiceImage} 
                        alt={currentTemplate.choiceValue || "Choice"} 
                        style={{ maxHeight: "50px" }}
                        className="border p-1"
                      />
                    </div>
                  )}
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="is-active"
                    label="Is Active"
                    defaultChecked={currentTemplate?.isActive !== false}
                  />
                </Form.Group>
              </>
            )}
            
            {templateType === "sentence" && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control 
                    type="text" 
                    defaultValue={currentTemplate?.title || ""}
                    placeholder="Enter the title of the passage"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select defaultValue={currentTemplate?.category || "Reading Comprehension"} disabled>
                    <option value="Reading Comprehension">Reading Comprehension</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Sentence templates are always for Reading Comprehension
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Reading Level</Form.Label>
                  <Form.Select defaultValue={currentTemplate?.readingLevel || ""}>
                    <option value="">Select Reading Level</option>
                    <option value="Low Emerging">Low Emerging</option>
                    <option value="Emerging">Emerging</option>
                    <option value="Developing">Developing</option>
                    <option value="Transitioning">Transitioning</option>
                    <option value="Fluent">Fluent</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Passage Pages</Form.Label>
                  <div className="bg-light p-3 rounded">
                    {currentTemplate?.sentenceText?.map((text, index) => (
                      <div key={index} className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong>Page {index + 1}</strong>
                          {index > 0 && (
                            <Button variant="outline-danger" size="sm">
                              <FaTimes />
                            </Button>
                          )}
                        </div>
                        <Form.Control 
                          as="textarea" 
                          rows={2} 
                          defaultValue={text}
                          placeholder="Enter the text for this page"
                        />
                        <Form.Group className="mt-2">
                          <Form.Label>Page Image</Form.Label>
                          <Form.Control type="file" />
                        </Form.Group>
                      </div>
                    )) || (
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong>Page 1</strong>
                        </div>
                        <Form.Control 
                          as="textarea" 
                          rows={2} 
                          placeholder="Enter the text for this page"
                        />
                        <Form.Group className="mt-2">
                          <Form.Label>Page Image</Form.Label>
                          <Form.Control type="file" />
                        </Form.Group>
                      </div>
                    )}
                    
                    <Button variant="outline-primary" size="sm" className="w-100 mt-2">
                      <FaPlus className="me-1" /> Add Another Page
                    </Button>
                  </div>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Comprehension Questions</Form.Label>
                  <div className="bg-light p-3 rounded">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong>Question 1</strong>
                      </div>
                      <Form.Control 
                        type="text" 
                        placeholder="Enter question text"
                      />
                      <Row className="mt-2">
                        <Col>
                          <Form.Label>Correct Answer</Form.Label>
                          <Form.Control 
                            type="text" 
                            placeholder="Correct answer"
                          />
                        </Col>
                        <Col>
                          <Form.Label>Other Options</Form.Label>
                          <Form.Control 
                            type="text" 
                            placeholder="Comma-separated options"
                          />
                        </Col>
                      </Row>
                    </div>
                    
                    <Button variant="outline-primary" size="sm" className="w-100 mt-2">
                      <FaPlus className="me-1" /> Add Another Question
                    </Button>
                  </div>
                </Form.Group>
              </>
            )}
          </Form>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="templates-tab">
      <Row className="mb-4">
        <Col md={7}>
          <h4>Template Management</h4>
          <p className="text-muted">
            Manage reusable templates for questions, choices, and reading passages
          </p>
        </Col>
        <Col md={5} className="text-end">
          <Button 
            variant="primary" 
            className="create-btn"
            onClick={handleCreateTemplate}
          >
            <FaPlus className="me-2" /> Create New Template
          </Button>
        </Col>
      </Row>

      <Tabs
        activeKey={templateType}
        onSelect={(key) => setTemplateType(key)}
        className="mb-4 template-type-tabs"
      >
        <Tab eventKey="question" title="Question Templates">
          <Card className="filter-section mb-4">
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      value={filters.category}
                      onChange={(e) => handleFilterChange("category", e.target.value)}
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      value={filters.isApproved}
                      onChange={(e) => handleFilterChange("isApproved", e.target.value)}
                    >
                      <option value="All">All</option>
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Search</Form.Label>
                    <div className="d-flex">
                      <Form.Control
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Button 
                        variant="outline-secondary" 
                        className="ms-2"
                        onClick={resetFilters}
                      >
                        Reset
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading templates...</p>
            </div>
          ) : (
            renderQuestionTemplatesTable()
          )}
        </Tab>
        
        <Tab eventKey="choice" title="Choice Templates">
          <Card className="filter-section mb-4">
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Search</Form.Label>
                    <div className="d-flex">
                      <Form.Control
                        type="text"
                        placeholder="Search by value, type or sound..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Button 
                        variant="outline-secondary" 
                        className="ms-2"
                        onClick={resetFilters}
                      >
                        Reset
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading templates...</p>
            </div>
          ) : (
            renderChoiceTemplatesTable()
          )}
        </Tab>
        
        <Tab eventKey="sentence" title="Sentence Templates">
          <Card className="filter-section mb-4">
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      value={filters.isApproved}
                      onChange={(e) => handleFilterChange("isApproved", e.target.value)}
                    >
                      <option value="All">All</option>
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={8}>
                  <Form.Group>
                    <Form.Label>Search</Form.Label>
                    <div className="d-flex">
                      <Form.Control
                        type="text"
                        placeholder="Search by title or reading level..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Button 
                        variant="outline-secondary" 
                        className="ms-2"
                        onClick={resetFilters}
                      >
                        Reset
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading templates...</p>
            </div>
          ) : (
            renderSentenceTemplatesTable()
          )}
        </Tab>
      </Tabs>

      {/* Template Modal */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)} 
        size={modalMode === "view" ? "lg" : "xl"}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === "view" ? "Template Details" : 
             modalMode === "create" ? "Create New Template" : "Edit Template"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {renderModalContent()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            {modalMode === "view" ? "Close" : "Cancel"}
          </Button>
          {modalMode === "view" && currentTemplate && (
            <Button 
              variant="primary" 
              onClick={() => {
                setModalMode("edit");
              }}
            >
              Edit Template
            </Button>
          )}
          {(modalMode === "create" || modalMode === "edit") && (
            <Button variant="primary">
              {modalMode === "create" ? "Create Template" : "Save Changes"}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TemplatesTab;